import { initUrl } from "@a11ywatch/website-source-builder";
import { controller } from "../../proto/actions/calls";

interface CrawlParams {
  urlMap?: string; // [Deprecated]: use url
  url?: string;
  scan?: boolean; // determine scan or crawl method
  userId?: number;
}
// run request to `crawler` and either scan or crawl website. Scan is real time while crawl is delayed.
export const watcherCrawl = async ({
  urlMap,
  url: urlTarget,
  userId,
  scan = false,
}: CrawlParams) => {
  const target = urlMap || urlTarget;
  const url = String(initUrl(target, true));

  let data;

  try {
    if (scan) {
      data = await controller.crawlerScan({
        url,
        id: userId,
      });
    } else {
      data = await controller.crawlerCrawl({
        url,
        id: userId,
      });
    }
  } catch (e) {
    console.error(e);
  }

  return data;
};
