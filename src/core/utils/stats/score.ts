import { generateWebsiteAverage } from "@app/core/controllers/subdomains/update";
import { getWebsite } from "@app/core/controllers/websites";
import { CRAWL_COMPLETE } from "@app/core/static";
import { pubsub } from "@app/database/pubsub";
import { collectionUpsert } from "../collection-upsert";

export function setWebsiteScore(props: {
  domain?: string;
  userId?: number;
}): Promise<boolean>;

// set website score and send complete subcription
export async function setWebsiteScore({ domain, userId }) {
  try {
    const [website, websiteCollection] = await getWebsite({
      domain,
      userId,
    });

    const adaScore = await generateWebsiteAverage({ domain, userId });

    const updateWebsiteProps = {
      adaScore,
    };

    await collectionUpsert(
      updateWebsiteProps,
      [websiteCollection, !!website, null],
      { domain, userId }
    );

    // TODO: MOVE OUT OF METHOD
    await pubsub.publish(CRAWL_COMPLETE, {
      crawlComplete: {
        userId,
        domain,
        adaScore: adaScore || 0,
      },
    });

    return Promise.resolve(true);
  } catch (e) {
    console.error(e);
    return Promise.resolve(false);
  }
}
