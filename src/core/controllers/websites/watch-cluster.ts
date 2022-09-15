import { getHours } from "date-fns";
import { getWebsitesPaginated } from "../websites";
import { websiteWatch } from "./watch-pages";

// get users recursively
const _getUsersUntil = async (
  page: number = 0,
  userFilter: Record<string, unknown>
): Promise<void> => {
  const [pages] = await getWebsitesPaginated(20, userFilter, page);

  if (pages && pages?.length) {
    await websiteWatch(pages);
    return await _getUsersUntil(page + 2, userFilter);
  }
};

// get all users and filter by morning or night and run website scans daily.
export const crawlAllAuthedWebsitesCluster = async (): Promise<void> => {
  console.info("CRON * running");
  const morning = getHours(new Date()) === 11;
  const userFilter = morning ? { emailMorningOnly: { eq: true } } : {};

  // run even and odd async ops to gather users
  await Promise.all([
    _getUsersUntil(0, userFilter),
    _getUsersUntil(1, userFilter),
  ]);
};
