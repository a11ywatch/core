import { initUrl } from "@a11ywatch/website-source-builder";
import { controller } from "@app/proto/actions/calls";

export const watcherCrawl = async ({ urlMap, userId, scan = false }) => {
  const url = String(initUrl(urlMap, true));
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
