import { initUrl } from "@a11ywatch/website-source-builder";
import { controller } from "@app/proto/actions/calls";

export const watcherCrawl = async ({ urlMap, userId, scan = false }) => {
  const url = String(initUrl(urlMap, true));
  // scan - sends results as found while crawl waits till all links
  const method = scan ? "crawlerScan" : "crawlerCrawl";

  try {
    await controller[method]({
      url,
      id: userId,
    });
  } catch (e) {
    console.error(e);
  }
};
