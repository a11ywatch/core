import { crawlPage } from "../../actions";
import { getUser } from "../../controllers/users";
import { watcherCrawl } from "../../actions/accessibility/watcher_crawl";
import type { Website } from "../../../types/schema";
import { validateScanEnabled } from "../users/update/scan-attempt";

// run a set of websites and get issues [DAILY CRON]
export async function websiteWatch(pages: Website[] = []): Promise<void> {
  for (const website of pages) {
    const { userId, url, subdomains, tld, ua, proxy } = website;
    const [user] = await getUser({ id: userId });

    // prevent unconfirmed emails from job
    if (!user || (user && !user?.emailConfirmed) || !url) {
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
    } else if (
      validateScanEnabled({
        user,
      })
    ) {
      await watcherCrawl({
        url: url,
        userId,
        scan: false,
        subdomains,
        tld,
        agent: ua,
        proxy,
      });
    }
  }
}
