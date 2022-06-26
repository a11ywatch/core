import { crawlPage } from "../../actions";
import { getUser } from "../../controllers/users";
import { watcherCrawl } from "../../actions/crawl/watcher_crawl";
import type { Website } from "../../../schema";

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
  if (pages && Array.isArray(!pages)) {
    return Promise.resolve(null);
  }
  console.log(`watcher job count ${pages.length}`);

  for (const website of pages) {
    const { userId, url, subdomains, tld } = website;

    let user;
    try {
      [user] = await getUser({ id: userId });
    } catch (e) {
      console.error(e);
    }

    console.log(
      `current url of job ${url}. Email enabled ${user.alertEnabled}`
    );

    if (!user) {
      continue;
    }

    if (user.role === 0) {
      try {
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
      } catch (e) {
        console.error(e);
      }
    } else {
      setImmediate(async () => {
        await watcherCrawl({
          urlMap: url,
          userId,
          scan: false,
          subdomains,
          tld,
        });
      });
    }
  }
}
