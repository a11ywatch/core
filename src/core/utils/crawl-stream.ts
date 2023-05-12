import type { FastifyContext } from "apollo-server-fastify";
import {
  watcherCrawl,
  CrawlParams,
} from "../actions/accessibility/watcher_crawl";
import { crawlingSet, getKey } from "../../event/crawl-tracking";
import { crawlEmitter, crawlTrackingEmitter } from "../../event";
import { getHostName } from "./get-host";
import { getActiveCrawlKey } from "../../event/names";

// crawl website and wait for finished emit event to continue @return Website[] use for testing.
export const crawlHttpStream = (
  props: CrawlParams,
  res: FastifyContext["reply"],
  removeTrailing: boolean = true // disable for high performance output
): Promise<boolean> => {
  const {
    url,
    userId,
    subdomains,
    tld,
    robots = true,
    agent,
    proxy,
    sitemap,
  } = props;

  const domain = getHostName(url);
  const crawlEvent = getActiveCrawlKey(domain, userId);
  const key = getKey(domain, undefined, userId); // crawl event key

  return new Promise((resolve) => {
    const crawlListener = removeTrailing
      ? (source) => {
          setImmediate(() => {
            const data = source?.data;
            if (data && !res.raw.writableEnded) {
              const issuesFound = data?.issues?.length;
              const crawlSource = crawlingSet.has(key);

              // raw json string building
              res.raw.write(
                `${JSON.stringify({
                  data,
                  message: `${data?.url} has ${issuesFound} issue${
                    issuesFound === 1 ? "" : "s"
                  }`,
                  success: true,
                  code: 200,
                })}${!crawlSource ? "" : ","}`
              );
            }
          });
        }
      : (source) => {
          setImmediate(() => {
            const data = source?.data;
            if (data && !res.raw.writableEnded) {
              const issuesFound = data?.issues?.length;

              // raw json string building
              res.raw.write(
                `${JSON.stringify({
                  data,
                  message: `${data?.url} has ${issuesFound} issue${
                    issuesFound === 1 ? "" : "s"
                  }`,
                  success: true,
                  code: 200,
                })},`
              );
            }
          });
        };

    const crawlCompleteListener = () => {
      setImmediate(() => {
        crawlTrackingEmitter.off(crawlEvent, crawlListener);

        resolve(true);
      });
    };

    crawlEmitter.on(crawlEvent, crawlListener);

    crawlTrackingEmitter.once(`crawl-complete-${key}`, crawlCompleteListener);

    setImmediate(
      async () =>
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
        })
    );
  });
};
