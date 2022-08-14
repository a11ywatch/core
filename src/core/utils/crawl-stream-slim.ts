import { watcherCrawl } from "@app/core/actions/accessibility/watcher_crawl";
import { crawlEmitter, crawlTrackingEmitter } from "@app/event";
import { getKey } from "@app/event/crawl-tracking";

import { domainName } from "./domain-name";
import { getHostName } from "./get-host";
import type { CrawlProps } from "./crawl-stream";
import { FastifyContext } from "apollo-server-fastify";

// crawl website slim and wait for finished emit event to continue @return Website[] use for testing.
export const crawlHttpStreamSlim = (
  props: CrawlProps,
  res: FastifyContext["reply"],
  client?: string,
  onlyData?: boolean // remove issues and other data from stream
): Promise<boolean> => {
  const { url, userId, subdomains, tld } = props;

  setImmediate(async () => {
    await watcherCrawl({
      url,
      scan: true,
      userId,
      subdomains: !!subdomains,
      tld: !!tld,
    });
  });

  return new Promise((resolve) => {
    const domain = getHostName(url);

    crawlEmitter.on(`crawl-${domainName(domain)}-${userId || 0}`, (source) => {
      const data = source?.data;

      // only send when true
      if (data) {
        // trim data for sending minimally
        if (onlyData) {
          data.pageLoadTime = null;
          data.issues = null;
        }
        res.raw.write(`${JSON.stringify(data)},`);
      }
    });

    crawlTrackingEmitter.once(
      `crawl-complete-${getKey(domain, undefined, userId)}`,
      () => {
        if (client && client.includes("a11ywatch_cli/")) {
          // send extra item for trailing comma handler
          res.raw.write(`${JSON.stringify({ url: "", domain: "" })}`, () => {
            resolve(true);
          });
        } else {
          resolve(true);
        }
      }
    );
  });
};
