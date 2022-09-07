import { getHostName } from "@a11ywatch/website-source-builder";
import { performance } from "perf_hooks";
import { bindTaskQ, getCWLimit } from "../queues/crawl/handle";
import { qWebsiteWorker } from "../queues/crawl";
import { crawlTrackingEmitter } from "./emitters/crawl";
import { domainName } from "../core/utils";
import type { ScanRpcCall } from "../proto/calls/scan-stream";

type CrawlSet = {
  total: number; // total pages
  current: number; // current page number
  crawling: boolean; // active crawl
  shutdown: boolean; // crawl shutdown
  duration: number; // the crawl duration
  event: ReturnType<typeof bindTaskQ>; // queue
};

// track when a new website starts and determine page completion
export let crawlingSet: Record<string, CrawlSet> = {};

const crawlDefault: CrawlSet = {
  total: 0,
  current: 0,
  crawling: true,
  shutdown: false,
  duration: 0,
  event: bindTaskQ(Object.keys(crawlingSet).length), // set to default to memo
};

// handle hostname assign from domain or pages
const extractHostname = (domain?: string, pages?: string[]) => {
  const target = pages && pages.length === 1 ? pages[0] : domain;
  return domainName(getHostName(target));
};

// get a key for the event based on domain and uid.
export const getKey = (domain, pages, user_id) =>
  `${extractHostname(domain, pages)}-${user_id || 0}`;

// remove key from object
export const removeKey = (key, { [key]: _, ...rest }) => rest;

// rebind the number of concurrency per object
const rebindConcurrency = async () => {
  const keys = Object.keys(crawlingSet);
  const newLimit = getCWLimit(keys.length || 1);

  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const item = crawlingSet[k];
    const itemEvent = item && item?.event;

    if (itemEvent && itemEvent?.concurrency > newLimit) {
      const q = itemEvent.getQueue();
      itemEvent.killAndDrain();
      await itemEvent.drained(); // wait till drained
      crawlingSet[k].event.concurrency = newLimit;
      for (let j = 0; j < q.length; j++) {
        await itemEvent.unshift(q[j]);
      }
    } else if (itemEvent && itemEvent?.concurrency !== newLimit) {
      crawlingSet[k].event.concurrency = newLimit;
    }
  }
};

// init crawling
const crawlStart = (target) => {
  setImmediate(async () => {
    const key = getKey(target.domain, target.pages, target.user_id);
    // set the item for tracking
    if (!crawlingSet[key]) {
      crawlingSet[key] = Object.assign({}, crawlDefault, {
        duration: performance.now(),
        event: bindTaskQ(Object.keys(crawlingSet).length + 1), // add 1 to include new item
      });

      rebindConcurrency();
    }
  });
};

// de-init crawling
const deInit = async (key, target) => {
  crawlTrackingEmitter.emit(`crawl-complete-${key}`, target);
  const params = {
    userId: target.user_id,
    meta: {
      extra: {
        domain: extractHostname(target.domain),
        duration: performance.now() - crawlingSet[key].duration,
        shutdown: crawlingSet[key].shutdown,
      },
    },
  };
  crawlingSet = removeKey(key, crawlingSet);
  rebindConcurrency(); // rebind event queue and increment limit
  await qWebsiteWorker.push(params);
};

// complete crawl
const crawlComplete = (target) => {
  setImmediate(async () => {
    const userId = target.user_id;
    const key = getKey(target.domain, target.pages, userId);

    if (crawlingSet[key]) {
      crawlingSet[key].crawling = false;

      if (crawlingSet[key].current === crawlingSet[key].total) {
        await deInit(key, target);
      }
    }
  });
};

// gRPC call
const crawlProcessing = (call: ScanRpcCall) => {
  setImmediate(async () => {
    const target = call.request;
    const key = getKey(target.domain, target.pages, target.user_id); // process a new item tracking count

    if (crawlingSet[key]) {
      if (crawlingSet[key].crawling) {
        crawlingSet[key].total = crawlingSet[key].total + 1;
      }
      if (crawlingSet[key].shutdown) {
        call.write({ message: "shutdown" });
        await deInit(key, target);
      }
    }

    call.end();
  });
};

// crawl finished processing the page
const crawlProcessed = (target) => {
  setImmediate(async () => {
    // process a new item tracking count
    const userId = target.user_id;
    const key = getKey(target.domain, target.pages, userId);

    if (crawlingSet[key]) {
      crawlingSet[key].current = crawlingSet[key].current + 1;

      // shutdown the events
      if (target.shutdown) {
        crawlingSet[key].shutdown = true;
        crawlingSet[key].crawling = false;
      }

      if (
        crawlingSet[key].current === crawlingSet[key].total &&
        !crawlingSet[key].crawling
      ) {
        await deInit(key, target);
      }
    }
  });
};

/*  Emit events to track crawling progress.
 *  This mainly tracks at a higher level the progress between the gRPC crawling across modules.
 *  TODO: allow configuring a url and passing in optional Promise handling.
 *  @param url: scope the events to track one domain
 */
export const establishCrawlTracking = () => {
  // track when crawl has started
  crawlTrackingEmitter.on("crawl-start", crawlStart);
  // track when the crawler has processed the pages and sent.
  crawlTrackingEmitter.on("crawl-complete", crawlComplete);
  // track total amount of pages in a website via gRPC.
  crawlTrackingEmitter.on("crawl-processing", crawlProcessing);
  // track the amount of pages the website should have and determine if complete.
  crawlTrackingEmitter.on("crawl-processed", crawlProcessed);
};
