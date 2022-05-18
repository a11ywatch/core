import { getHours } from "date-fns";
import { getWebsitesPaginated } from "../websites";
import { websiteWatch } from "./watch-pages";

// get all users and filter by morning or night and run website scans daily.
export const crawlAllAuthedWebsitesCluster = async (): Promise<void> => {
  const morning = getHours(new Date()) === 11;
  const userFilter = morning ? { emailMorningOnly: { eq: true } } : {};

  console.log(morning ? `Started: morning CRON` : "Started: night CRON");

  // get all users async and run website scans.
  const getUsersUntil = async (page = 0) => {
    try {
      const [allWebPages] = await getWebsitesPaginated(20, userFilter, page);
      if (allWebPages?.length) {
        await websiteWatch(allWebPages);
        await getUsersUntil(page + 1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  await getUsersUntil();
};
