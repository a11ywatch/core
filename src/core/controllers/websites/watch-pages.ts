import { crawlPage } from "../../actions";
import { getUser } from "../../controllers/users";
import { watcherCrawl } from "../../actions/accessibility/watcher_crawl";
import type { Website } from "../../../types/schema";

type Page = {
  userId?: number;
  url: string;
  subdomains?: boolean;
  tld?: boolean;
};

// run a set of websites and get issues [DAILY CRON]
export async function websiteWatch(
  pages: Page[] | Website[] = []
): Promise<void> {
  for (const website of pages) {
    const { userId, url, subdomains, tld } = website;
    const [user] = await getUser({ id: userId });

    // prevent unconfirmed emails from job
    if (!user || user && !user?.emailConfirmed || !url) {
      continue;
    }

    if (!user.role) {
      await crawlPage(
        {
          url,
          userId,
          pageInsights: false,
          sendSub: false,
          user,
        },
        user.alertEnabled,
        true
      );
    } else {
      setImmediate(async () => {
        await watcherCrawl({
          url: url,
          userId,
          scan: false,
          subdomains,
          tld,
        });
      });
    }
  }
}
