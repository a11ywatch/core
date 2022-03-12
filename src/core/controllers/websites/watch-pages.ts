import { getDay, subHours } from "date-fns";
import { crawlWebsite } from "@app/core/controllers/subdomains/update";
import { getWebsitesWithUsers } from "@app/core/controllers/websites";
import { getUser } from "@app/core/controllers/users";
import { getPageItem } from "./utils";
import { Website } from "@app/types";

export async function websiteWatch(pages: Website[]): Promise<void> {
  let allWebPages = pages ?? [];

  if (!pages) {
    try {
      allWebPages = await getWebsitesWithUsers();
    } catch (e) {
      console.error(e);
    }
  }

  for (const website of allWebPages) {
    const { userId, url } = getPageItem(website);
    const [user] = await getUser({ id: userId }).catch((e) => {
      console.error(e);
      return [null];
    });

    if (user) {
      const emailAvailable =
        user && user.alertEnabled && Array.isArray(user.emailFilteredDates);

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
