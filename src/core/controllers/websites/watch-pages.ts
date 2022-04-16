import { getDay, subHours } from "date-fns";
import { crawlWebsite } from "@app/core/controllers/subdomains/update";
import { getUser } from "@app/core/controllers/users";

type Page = {
  userId?: number;
  url: string;
};

// run a set of websites and get issues
export async function websiteWatch(pages: Page[] = []): Promise<void> {
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

        await crawlWebsite(
          {
            url,
            userId,
            pageInsights: false,
            sendSub: false,
          },
          sendEmail
        );
      }
    } catch (e) {
      console.error(e);
    }
  }
}
