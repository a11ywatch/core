import { getHostName } from "@a11ywatch/website-source-builder";
import { performance } from "perf_hooks";
import { qWebsiteWorker } from "../queues/crawl";
import { crawlTrackingEmitter } from "./emitters/crawl";
import { domainName } from "../core/utils";
import type { ScanRpcCall } from "../proto/calls/scan-stream";

// handle hostname assign from domain or pages
const extractHostname = (domain?: string, pages?: string[]) => {
  const target = pages && pages.length === 1 ? pages[0] : domain;
  return domainName(getHostName(target));
};

// get a key for the event based on domain and uid.
export const getKey = (domain, pages, user_id) => {
  return `${extractHostname(domain, pages)}-${user_id || 0}`;
};

// remove key from object
export const removeKey = (key, { [key]: _, ...rest }) => rest;

/*  Emit events to track crawling progress.
 *  This mainly tracks at a higher level the progress between the gRPC crawling across modules.
 *  TODO: allow configuring a url and passing in optional Promise handling.
 *  @param url: scope the events to track one domain
 */
export const establishCrawlTracking = () => {
  // track when a new website starts and determine page completion
  let crawlingSet = {};

  crawlTrackingEmitter.on("crawl-start", (target) => {
    setImmediate(() => {
      const key = getKey(target.domain, target.pages, target.user_id);

      // set the item for tracking
      if (!crawlingSet[key]) {
        crawlingSet[key] = {
          total: 0,
          current: 0,
          crawling: true,
          duration: performance.now(),
          shutdown: false,
        };
      }
    });
  });

  // track when the crawler has processed the pages and sent.
  crawlTrackingEmitter.on("crawl-complete", (target) => {
    setImmediate(async () => {
      const userId = target.user_id;
      const key = getKey(target.domain, target.pages, userId);

      if (crawlingSet[key]) {
        crawlingSet[key].crawling = false;

        if (crawlingSet[key].current === crawlingSet[key].total) {
          crawlTrackingEmitter.emit(`crawl-complete-${key}`, target);
          try {
            await qWebsiteWorker.push({
              userId,
              meta: {
                extra: {
                  domain: extractHostname(target.domain),
                  duration: performance.now() - crawlingSet[key].duration,
                  shutdown: crawlingSet[key].shutdown,
                },
              },
            });
          } catch (e) {
            console.error(e);
          }
          crawlingSet = removeKey(key, crawlingSet); // remove after completion
        }
      }
    });
  });

  // track total amount of pages in a website via gRPC.
  crawlTrackingEmitter.on("crawl-processing", (call: ScanRpcCall) => {
    setImmediate(async () => {
      const target = call.request;
      const key = getKey(target.domain, target.pages, target.user_id); // process a new item tracking count

      if (crawlingSet[key]) {
        if (crawlingSet[key].crawling) {
          crawlingSet[key].total = crawlingSet[key].total + 1;
        }
        if (crawlingSet[key].shutdown) {
          call.write({ message: "shutdown" });
          crawlTrackingEmitter.emit(`crawl-complete-${key}`, target);
          try {
            await qWebsiteWorker.push({
              userId: target.user_id,
              meta: {
                extra: {
                  domain: extractHostname(target.domain),
                  duration: performance.now() - crawlingSet[key].duration,
                  shutdown: true,
                },
              },
            });
          } catch (e) {
            console.error(e);
          }
          crawlingSet = removeKey(key, crawlingSet);
        }
      }

      call.end();
    });
  });

  // track the amount of pages the website should have and determine if complete.
  crawlTrackingEmitter.on("crawl-processed", (target) => {
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
          crawlTrackingEmitter.emit(`crawl-complete-${key}`, target);
          try {
            await qWebsiteWorker.push({
              userId,
              meta: {
                extra: {
                  domain: extractHostname(target.domain),
                  duration: performance.now() - crawlingSet[key].duration,
                  shutdown: crawlingSet[key].shutdown,
                },
              },
            });
          } catch (e) {
            console.error(e);
          }
          crawlingSet = removeKey(key, crawlingSet); // Crawl completed
        }
      }
    });
  });
};
