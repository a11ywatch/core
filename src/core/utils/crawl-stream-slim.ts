import type { FastifyContext } from "apollo-server-fastify";
import { watcherCrawl } from "../actions/accessibility/watcher_crawl";
import { getKey } from "../../event/crawl-tracking";
import { crawlEmitter, crawlTrackingEmitter } from "../../event";

import { domainName } from "./domain-name";
import { getHostName } from "./get-host";
import type { CrawlProps } from "./crawl-stream";

// crawl website slim and wait for finished emit event to continue @return Website[] use for testing.
export const crawlHttpStreamSlim = (
  props: CrawlProps,
  res: FastifyContext["reply"],
  client?: string,
  onlyData?: boolean // remove issues and other data from stream
): Promise<boolean> => {
  const { url, userId, subdomains, tld, robots } = props;

  setImmediate(async () => {
    await watcherCrawl({
      url,
      userId,
      subdomains: !!subdomains,
      tld: !!tld,
      scan: true,
      robots,
    });
  });

  return new Promise((resolve) => {
    const domain = getHostName(url);
    const crawlEvent = `crawl-${domainName(domain)}-${userId || 0}`;

    const crawlListener = (source) => {
      setImmediate(() => {
        const data = source?.data;

        // only send when true
        if (data) {
          // trim data for sending minimally
          if (onlyData) {
            data.pageLoadTime = null;
            data.issues = null;
          }
          if (!res.raw.writableEnded) {
            res.raw.write(`${JSON.stringify(data)},`);
          }
        }
      });
    };

    crawlEmitter.on(crawlEvent, crawlListener);

    const crawlComplete = () => {
      setImmediate(() => {
        crawlTrackingEmitter.off(crawlEvent, crawlListener);

        if (
          client &&
          client.includes("a11ywatch_cli/") &&
          !res.raw.writableEnded
        ) {
          // send extra item for trailing comma handler
          res.raw.write(`${JSON.stringify({ url: "", domain: "" })}`, () =>
            resolve(true)
          );
          // res.raw.flushHeaders();
        } else {
          resolve(true);
        }
      });
    };

    crawlTrackingEmitter.once(
      `crawl-complete-${getKey(domain, undefined, userId)}`,
      crawlComplete
    );
  });
};
