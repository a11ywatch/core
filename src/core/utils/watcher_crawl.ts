import { initUrl } from "@a11ywatch/website-source-builder";
import { controller } from "@app/proto/actions/calls";

// run request to `crawler` and either scan or crawl website. Scan is real time while crawl is delayed.
export const watcherCrawl = async ({ urlMap, userId, scan = false }) => {
  const url = String(initUrl(urlMap, true));
  const method = scan ? "crawlerScan" : "crawlerCrawl"; // either real time links or gather all until

  try {
    return await controller[method]({
      url,
      id: userId,
    });
  } catch (e) {
    console.error(e);
  }
};
