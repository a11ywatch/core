import { SUPER_MODE } from "@app/config/config";
import { watcherCrawl } from "@app/core/actions/crawl/watcher_crawl";
import { crawlEmitter } from "@app/event";
import { domainName } from "./domain-name";

interface CrawlMultiSite {
  data?: any[];
  message: string;
  success?: boolean;
}

// crawl website and wait for finished emit event to continue @return Website[] use for testing.
export const crawlMultiSiteWithEvent = (props): Promise<CrawlMultiSite> => {
  return new Promise(async (resolve) => {
    const { url, userId, subdomains, tld } = props;

    try {
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
    } catch (e) {
      console.error(e);
    }

    let requestTimeout;

    if (!SUPER_MODE) {
      // Max limit 15mins. TODO: remove for full stream usage.
      requestTimeout = setTimeout(() => {
        resolve({
          success: false,
          data: null,
          message:
            "Scan exceeded timeout 15mins. Try to login and use the website for larger scans.",
        });
      }, 900000);
    }

    // wait for crawl event to finish.
    crawlEmitter.once(
      `crawl-${domainName(url)}-${userId || 0}`,
      (_target, data) => {
        const pageCount = data?.length ?? 0;

        if (requestTimeout) {
          clearTimeout(requestTimeout);
        }

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
