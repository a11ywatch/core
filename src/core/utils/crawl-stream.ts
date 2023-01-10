import type { FastifyContext } from "apollo-server-fastify";
import {
  watcherCrawl,
  CrawlParams,
} from "../actions/accessibility/watcher_crawl";
import { crawlingSet, getKey } from "../../event/crawl-tracking";
import { crawlEmitter, crawlTrackingEmitter } from "../../event";
import { domainName } from "./domain-name";
import { getHostName } from "./get-host";

// crawl website and wait for finished emit event to continue @return Website[] use for testing.
export const crawlHttpStream = (
  props: CrawlParams,
  res: FastifyContext["reply"],
  removeTrailing: boolean = true // disable for high performance output
): Promise<boolean> => {
  const { url, userId, subdomains, tld, robots = true, agent } = props;

  setImmediate(async () => {
    await watcherCrawl({
      url,
      userId,
      subdomains: !!subdomains,
      tld: !!tld,
      scan: true,
      robots,
      agent,
    });
  });

  return new Promise((resolve) => {
    const domain = getHostName(url);
    const crawlEvent = `crawl-${domainName(domain)}-${userId || 0}`;
    const key = getKey(domain, undefined, userId); // crawl event key

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
  });
};
