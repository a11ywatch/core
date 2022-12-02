import { generateWebsiteScore } from "../../controllers/pages/update";
import { getWebsite } from "../../controllers/websites";
import { CRAWL_COMPLETE } from "../../static";
import { pubsub } from "../../../database/pubsub";
import { connect } from "../../../database";

import { collectionUpsert } from "../collection-upsert";

export function setWebsiteScore(props: {
  domain: string;
  userId: number;
  duration: number;
  shutdown?: boolean; // crawl was shutdown and not completed
}): Promise<boolean>;

// set website score and send complete subcription
export async function setWebsiteScore({
  domain,
  userId,
  duration,
  shutdown = false,
}) {
  const [website, websiteCollection] = await getWebsite({
    domain,
    userId,
  });

  const targetDomain = website?.domain || domain;

  const { issuesInfo } = await generateWebsiteScore({
    domain: targetDomain,
    userId,
    all: website?.subdomains || website?.tld,
  });

  if (issuesInfo && website) {
    const [analayticsCollection] = connect("Analytics");

    await collectionUpsert(issuesInfo, [analayticsCollection, true], {
      searchProps: {
        domain: targetDomain,
        userId,
      },
    });

    await collectionUpsert(
      {
        ...website,
        crawlDuration: duration, // time it took to crawl the entire website in ms
        shutdown, // crawl did not complete - plan needs to be higher
      },
      [websiteCollection, !!website],
      {
        searchProps: {
          domain: targetDomain,
          userId,
        },
      }
    );
  }

  try {
    await pubsub.publish(CRAWL_COMPLETE, {
      crawlComplete: {
        userId,
        domain: website?.domain,
        adaScoreAverage: issuesInfo?.adaScoreAverage,
        shutdown,
      },
    });
  } catch (e) {
    console.error(e);
  }

  return Promise.resolve(true);
}
