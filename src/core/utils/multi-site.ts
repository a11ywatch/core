import { watcherCrawl } from "../actions/accessibility/watcher_crawl";
import { crawlEmitter } from "../../event";
import { domainName } from "./domain-name";

// multi page website crawl gather all results via events
type CrawlMultiSite = {
  data?: any[];
  message: string;
  success?: boolean;
};

type CrawlProps = {
  url: string;
  userId?: number;
  subdomains?: boolean;
  tld?: boolean;
};

// crawl website and wait for finished emit event to continue @return Website[] use for testing and via sidecar.
export const crawlMultiSiteWithEvent = (
  props: CrawlProps
): Promise<CrawlMultiSite> => {
  const { url, userId, subdomains, tld } = props;

  // start site-wide crawls
  setImmediate(async () => {
    await watcherCrawl({
      url,
      scan: false,
      userId,
      subdomains: !!subdomains,
      tld: !!tld,
    });
  });

  return new Promise(async (resolve) => {
    // wait for crawl event to finish.
    crawlEmitter.once(
      `crawl-${domainName(url)}-${userId || 0}`,
      (_target, data) => {
        const pageCount = data?.length ?? 0;

        resolve({
          data,
          message: `Scan finished and ${pageCount} page${
            pageCount === 1 ? "" : "s"
          } have issues found.`,
          success: true,
        });
      }
    );
  });
};
