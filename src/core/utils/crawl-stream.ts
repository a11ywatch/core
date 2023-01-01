import type { FastifyContext } from "apollo-server-fastify";
import {
  watcherCrawl,
  CrawlParams,
} from "../actions/accessibility/watcher_crawl";
import { getKey } from "../../event/crawl-tracking";
import { crawlEmitter, crawlTrackingEmitter } from "../../event";
import { domainName } from "./domain-name";
import { getHostName } from "./get-host";

// crawl website and wait for finished emit event to continue @return Website[] use for testing.
export const crawlHttpStream = (
  props: CrawlParams,
  res: FastifyContext["reply"],
  client?: string
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

    const crawlListener = (source) => {
      setImmediate(() => {
        const data = source?.data;
        if (data) {
          const issuesFound = data?.issues?.length;

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

    const crawlEvent = `crawl-${domainName(domain)}-${userId || 0}`;

    const crawlCompleteListener = () => {
      setImmediate(() => {
        crawlTrackingEmitter.off(crawlEvent, crawlListener);

        // send extra item for trailing comma handler non rpc
        if (client && client.includes("a11ywatch_cli/")) {
          res.raw.write(
            `${JSON.stringify({
              data: null,
              message: `Crawl completed`,
              success: true,
              code: 200,
            })}`,
            () => {
              resolve(true);
            }
          );
        } else {
          resolve(true);
        }
      });
    };

    crawlEmitter.on(crawlEvent, crawlListener);

    crawlTrackingEmitter.once(
      `crawl-complete-${getKey(domain, undefined, userId)}`,
      crawlCompleteListener
    );
  });
};
