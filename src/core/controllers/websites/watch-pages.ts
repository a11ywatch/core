import { getDay, subHours } from "date-fns";
import { crawlWebsite } from "@app/core/controllers/subdomains/update";
import { getUser } from "@app/core/controllers/users";

type Page = {
  userId?: number;
  url: string;
};

export async function websiteWatch(pages: Page[] = []): Promise<void> {
  for (const website of pages) {
    const { userId, url } = website;

    const [user] = await getUser({ id: userId }).catch((e) => {
      console.error(e);
      return [null];
    });

    if (user) {
      const emailAvailable =
        user && user.alertEnabled && Array.isArray(user.emailFilteredDates);

      // TODO: LOOK AT DAY DETECTION FOR USER EMAILS
      const sendEmail = emailAvailable
        ? !user.emailFilteredDates.includes(getDay(subHours(new Date(), 12)))
        : true;

      try {
        await crawlWebsite(
          {
            url,
            userId,
            pageInsights: false,
          },
          sendEmail
        );
      } catch (e) {
        console.error(e);
      }
    }
  }
}
