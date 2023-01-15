import { generateWebsiteScore } from "../../controllers/pages/update";
import { getWebsite } from "../../controllers/websites";
import { CRAWL_COMPLETE } from "../../static";
import { pubsub } from "../../../database/pubsub";

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
    await collectionUpsert(
      {
        ...website,
        issuesInfo, // each website gets top level issues related to page
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
        accessScoreAverage: issuesInfo?.accessScoreAverage,
        shutdown,
      },
    });
  } catch (e) {
    console.error(e);
  }

  return Promise.resolve(true);
}
