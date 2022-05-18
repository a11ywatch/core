import { crawlPage } from "@app/core/actions";
import { getUser } from "@app/core/controllers/users";
import { watcherCrawl } from "@app/core/utils/watcher_crawl";
import { Website } from "@app/schema";
import { getEmailAllowedForDay } from "@app/core/utils/filters";

type Page = {
  userId?: number;
  url: string;
};

// run a set of websites and get issues [DAILY CRON]
export async function websiteWatch(
  pages: Page[] | Website[] = []
): Promise<void> {
  if (pages && Array.isArray(pages)) {
    for (const website of pages) {
      const { userId, url } = website;

      let user;
      try {
        [user] = await getUser({ id: userId });
      } catch (e) {
        console.error(e);
      }

      if (user) {
        // TODO: LOOK AT DAY DETECTION FOR USER EMAILS
        const sendEmail = getEmailAllowedForDay(user);

        try {
          // TODO: move to queue
          if (user.role === 0) {
            await crawlPage(
              {
                url,
                userId,
                pageInsights: false,
                sendSub: false,
              },
              sendEmail
            );
          } else {
            await watcherCrawl({ urlMap: url, userId, scan: false });
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }
}
