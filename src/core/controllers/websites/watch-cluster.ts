import { getHours } from "date-fns";
import { getWebsitesPaginated } from "../websites";
import { websiteWatch } from "./watch-pages";

// get all users and filter by morning or night and run website scans daily.
export const crawlAllAuthedWebsitesCluster = async (): Promise<void> => {
  const morning = getHours(new Date()) === 11;
  const userFilter = morning ? { emailMorningOnly: { eq: true } } : {};

  console.info(morning ? `Started: morning CRON` : "Started: night CRON");

  // get all websites by users batched async and run website scans.
  const getUsersUntil = async (page = 0) => {
    const [pages] = await getWebsitesPaginated(20, userFilter, page);
    const hasPages = pages && pages?.length;

    if (hasPages) {
      await websiteWatch(pages);
      return await getUsersUntil(page + 1);
    }
  };

  await getUsersUntil();
};
