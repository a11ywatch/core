import { getDay, subHours } from "date-fns";
import { crawlPage } from "@app/core/actions";
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

      let user;
      try {
        [user] = await getUser({ id: userId });
      } catch (e) {
        console.error(e);
      }

      if (user) {
        const { alertEnabled, emailFilteredDates } = user;

        const emailAvailable =
          alertEnabled && Array.isArray(emailFilteredDates);

        // TODO: LOOK AT DAY DETECTION FOR USER EMAILS
        const sendEmail = emailAvailable
          ? !emailFilteredDates.includes(getDay(subHours(new Date(), 12)))
          : true;

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
            console.log("running watching crawl #e");
            await watcherCrawl({ urlMap: url, userId, scan: false });
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }
}
