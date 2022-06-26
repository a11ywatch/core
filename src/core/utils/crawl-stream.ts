import { watcherCrawl } from "@app/core/actions/crawl/watcher_crawl";
import { crawlEmitter, crawlTrackingEmitter } from "@app/event";
import { getKey } from "@app/event/crawl-tracking";
import { Response } from "express";
import { domainName } from "./domain-name";
import { getHostName } from "./get-host";

// crawl website and wait for finished emit event to continue @return Website[] use for testing.
export const crawlHttpStream = (props, res: Response): Promise<boolean> => {
  const { url, userId, subdomains, tld } = props;
  try {
    // start site-wide crawls
    setImmediate(async () => {
      await watcherCrawl({
        url,
        scan: true,
        userId,
        subdomains: !!subdomains,
        tld: !!tld,
      });
    });
  } catch (e) {
    console.error(e);
  }

  return new Promise((resolve) => {
    const domain = getHostName(url);

    crawlEmitter.on(`crawl-${domainName(domain)}-${userId || 0}`, (source) => {
      const data = source?.data;
      const issuesFound = data?.issues?.length;

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
    });

    // TODO: add flag to tell rust crawler if user was real or not instead of u32 defaults
    const key = getKey(domain, undefined, userId);

    crawlTrackingEmitter.once(`crawl-complete-${key}`, resolve);
  });
};
