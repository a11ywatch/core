import type { FastifyContext } from "apollo-server-fastify";
import {
  watcherCrawl,
  CrawlParams,
} from "../actions/accessibility/watcher_crawl";
import { crawlingSet, getKey } from "../../event/crawl-tracking";
import { crawlEmitter, crawlTrackingEmitter } from "../../event";

import { getHostName } from "./get-host";
import { getActiveCrawlKey } from "../../event/names";

// crawl website slim and wait for finished emit event to continue @return Website[] use for testing.
export const crawlHttpStreamSlim = (
  props: CrawlParams,
  res: FastifyContext["reply"],
  removeTrailing: boolean = true
): Promise<boolean> => {
  const { url, userId, subdomains, tld, robots, agent, proxy, sitemap } = props;

  setImmediate(async () => {
    await watcherCrawl({
      url,
      userId,
      subdomains: !!subdomains,
      tld: !!tld,
      scan: true,
      robots,
      agent,
      proxy,
      sitemap,
    });
  });

  return new Promise((resolve) => {
    const domain = getHostName(url);
    const crawlEvent = getActiveCrawlKey(domain, userId);
    const key = getKey(domain, undefined, userId); // crawl event key

    const crawlListener = removeTrailing
      ? (source) => {
          setImmediate(() => {
            const data = source?.data;

            if (data && !res.raw.writableEnded) {
              const crawlSource = crawlingSet.has(key);

              res.raw.write(
                `${JSON.stringify(data)}${!crawlSource ? "" : ","}`
              );
            }
          });
        }
      : (source) => {
          setImmediate(() => {
            const data = source?.data;

            if (data && !res.raw.writableEnded) {
              res.raw.write(`${JSON.stringify(data)},`);
            }
          });
        };

    crawlEmitter.on(crawlEvent, crawlListener);

    const crawlComplete = () => {
      setImmediate(() => {
        crawlTrackingEmitter.off(crawlEvent, crawlListener);

        resolve(true);
      });
    };

    crawlTrackingEmitter.once(`crawl-complete-${key}`, crawlComplete);
  });
};
