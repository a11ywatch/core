import { getHours } from "date-fns";
import { getWebsitesWithUsers } from "../websites";
import { websiteWatch } from "./watch-pages";

// [Internal] method to cleanup invalid domain adds
export const cleanUpInvalidWebsite = async () => {
  let allWebPages = [];
  let collection;

  try {
    // TODO: recursive paginate 20 batch
    [allWebPages, collection] = await getWebsitesWithUsers(0);
  } catch (e) {
    console.error(e);
  }

  const colMap = {};
  allWebPages.forEach(async (item) => {
    // remove duplicates
    if (colMap[item.url]) {
      await collection.findOneAndDelete({ url: item.url });
    } else {
      colMap[item.url] = true;
    }
  });
};

export const crawlAllAuthedWebsitesCluster = async (): Promise<void> => {
  let allWebPages = [];
  const morning = getHours(new Date()) === 11;
  console.log(morning ? `morning cron` : "night cron");
  const userFilter = morning ? { emailMorningOnly: { eq: true } } : {};

  try {
    // TODO: move generate website to queue
    [allWebPages] = await getWebsitesWithUsers(0, userFilter);
  } catch (e) {
    console.error(e);
  }

  console.log(`total websites to scan ${allWebPages.length}`);

  await websiteWatch(allWebPages);
};
