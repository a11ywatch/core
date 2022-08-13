import { watcherCrawl } from "@app/core/actions/accessibility/watcher_crawl";
import { crawlEmitter, crawlTrackingEmitter } from "@app/event";
import type { Response } from "express";
import { getKey } from "@app/event/crawl-tracking";
import { domainName } from "./domain-name";
import { getHostName } from "./get-host";

export type CrawlProps = {
  url: string;
  userId?: number;
  subdomains?: boolean;
  tld?: boolean;
};

// crawl website and wait for finished emit event to continue @return Website[] use for testing.
export const crawlHttpStream = (
  props: CrawlProps,
  res: Response,
  client?: string
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
      if (data) {
        const issuesFound = data?.issues?.length;

        // TODO: optional context,message, for pure
        // TODO: shape with ttsc
        res.write(
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

    crawlTrackingEmitter.once(
      `crawl-complete-${getKey(domain, undefined, userId)}`,
      () => {
        // send extra item for trailing comma handler
        if (client.includes("a11ywatch_cli/")) {
          res.write(
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
      }
    );
  });
};
