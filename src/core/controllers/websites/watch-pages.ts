import { getDay, subHours } from "date-fns";
import { crawlWebsite } from "@app/core/actions";
import { getUser } from "@app/core/controllers/users";
import { watcherCrawl } from "@app/core/utils/watcher_crawl";

type Page = {
  userId?: number;
  url: string;
};

// run a set of websites and get issues [DAILY CRON]
export async function websiteWatch(pages: Page[] = []): Promise<void> {
  if (pages && Array.isArray(pages)) {
    for (const website of pages) {
      const { userId, url } = website;

      try {
        const [user] = await getUser({ id: userId });

        if (user) {
          const { alertEnabled, emailFilteredDates } = user;
          const emailAvailable =
            alertEnabled && Array.isArray(emailFilteredDates);

          // TODO: LOOK AT DAY DETECTION FOR USER EMAILS
          const sendEmail = emailAvailable
            ? !emailFilteredDates.includes(getDay(subHours(new Date(), 12)))
            : true;

          // SINGLE PAGE CRAWL ON DOMAIN
          if (!user.role) {
            await crawlWebsite(
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
        }
      } catch (e) {
        console.error(e);
      }
    }
  }
}
