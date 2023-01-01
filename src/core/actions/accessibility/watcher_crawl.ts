import { initUrl } from "@a11ywatch/website-source-builder";
import { controller } from "../../../proto/actions/calls";

export interface CrawlParams {
  url?: string;
  scan?: boolean; // determine scan or crawl method
  userId?: number;
  robots?: boolean; // respect robots txt file defaults to true
  subdomains?: boolean;
  tld?: boolean;
  agent?: string; // User-Agent to use during crawl
}

/**
 * Send to gRPC crawler request. Gathers all website pages.
 *
 * Examples:
 *
 *     await crawlPage({ url: "https://a11ywatch.com" });
 *     await crawlPage({ url: "https://a11ywatch.com", scan: true. subdomains: true, tld: false }); // async real time stream
 *     await crawlPage({ url: "https://a11ywatch.com", userId: 122, robots: true, agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4619.141 Safari/537.36" }); // run request and respect robots
 */
export const watcherCrawl = async ({
  url,
  userId,
  scan = false,
  robots = true,
  subdomains = false,
  tld = false,
  agent,
}: CrawlParams) => {
  const crawlParams = {
    url: initUrl(url, true),
    id: userId,
    robots,
    subdomains,
    tld,
    agent,
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
