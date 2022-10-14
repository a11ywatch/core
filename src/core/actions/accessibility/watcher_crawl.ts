import { initUrl } from "@a11ywatch/website-source-builder";
import { controller } from "../../../proto/actions/calls";

interface CrawlParams {
  urlMap?: string; // [Deprecated]: use url
  url?: string;
  scan?: boolean; // determine scan or crawl method
  userId?: number;
  robots?: boolean; // respect robots txt file defaults to true
  subdomains?: boolean;
  tld?: boolean;
}

/**
 * Send to gRPC crawler request. Gathers all website pages.
 *
 * Examples:
 *
 *     await crawlPage({ url: "https://a11ywatch.com" });
 *     await crawlPage({ url: "https://a11ywatch.com", scan: true. subdomains: true, tld: false }); // async real time stream
 *     await crawlPage({ url: "https://a11ywatch.com", userId: 122, robots: true }); // run request and respect robots
 */
export const watcherCrawl = async ({
  url,
  userId,
  scan = false,
  robots = true,
  subdomains = false,
  tld = false,
}: CrawlParams) => {
  const crawlParams = {
    url: initUrl(url, true),
    id: userId,
    robots,
    subdomains,
    tld,
  };

  try {
    if (scan) {
      await controller.crawlerScan(crawlParams);
    } else {
      await controller.crawlerCrawl(crawlParams);
    }
  } catch (e) {
    console.error(e);
  }
};
