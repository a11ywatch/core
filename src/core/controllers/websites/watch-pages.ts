import { crawlPage } from "../../actions";
import { getUser } from "../../controllers/users";
import { watcherCrawl } from "../../utils/watcher_crawl";
import { getEmailAllowedForDay } from "../../utils/filters";
import type { Website } from "../../../schema";

type Page = {
  userId?: number;
  url: string;
};

// run a set of websites and get issues [DAILY CRON]
export async function websiteWatch(
  pages: Page[] | Website[] = []
): Promise<void> {
  if (pages && Array.isArray(!pages)) {
    return Promise.resolve(null);
  }

  for (const website of pages) {
    const { userId, url } = website;

    let user;
    try {
      [user] = await getUser({ id: userId });
    } catch (e) {
      console.error(e);
    }

    if (!user) {
      continue;
    }

    // TODO: move to queue
    if (user.role === 0) {
      try {
        await crawlPage(
          {
            url,
            userId,
            pageInsights: false,
            sendSub: false,
          },
          getEmailAllowedForDay(user)
        );
      } catch (e) {
        console.error(e);
      }
    } else {
      setImmediate(async () => {
        await watcherCrawl({ urlMap: url, userId, scan: false });
      });
    }
  }
}
