import { getWebsitesWithUsers } from "../websites";
import { websiteWatch } from "./watch-pages";

/*
 * Cron handle schedule of main task
 * Crawl authenticated web pages
 * [Promise]: void
 */
export const crawlAllAuthedWebsites = async (): Promise<void> => {
  let allWebPages = [];

  try {
    // [TODO: move to queue] generate users
    allWebPages = await getWebsitesWithUsers(0);
  } catch (e) {
    console.error(e);
  }

  await websiteWatch(allWebPages);
};
