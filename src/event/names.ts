import { domainName } from "../core/utils";

// get the crawl key for active set items
export const getActiveCrawlKey = (domain: string, userId: number) =>
  `crawl-${domainName(domain)}-${userId || 0}`;
