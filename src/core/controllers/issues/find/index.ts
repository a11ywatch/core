import { connect } from "@app/database";
import { getHostName, websiteSearchParams } from "@app/core/utils";

export const getIssue = async (
  { url, pageUrl, userId, noRetries }: any,
  chain?: boolean
) => {
  try {
    const [collection] = await connect("Issues");
    const queryUrl = decodeURIComponent(String(url || pageUrl));

    const searchProps = websiteSearchParams({
      pageUrl: queryUrl,
      userId,
    });

    let issue = await collection.findOne(searchProps);

    // get issues from general bucket
    if (!issue && !noRetries) {
      issue = await collection.findOne({ pageUrl: queryUrl });
    }

    if (!issue && !noRetries) {
      issue = await collection.findOne({
        domain: getHostName(queryUrl),
      });
    }

    return chain ? [issue, collection] : issue;
  } catch (e) {
    console.error(e);
  }
};

export const getIssues = async ({
  userId,
  domain,
  pageUrl,
  url,
  filter,
}: any) => {
  try {
    const [collection] = await connect("Issues");

    const queryUrl = (pageUrl || url) && decodeURIComponent(pageUrl || url);

    const searchProps = websiteSearchParams({
      domain: domain || getHostName(queryUrl),
      filter,
      userId,
    });

    // TODO: PAGINATION
    return await collection
      .find(searchProps)
      .sort({ pageUrl: 1 })
      .limit(20000)
      .toArray();
  } catch (e) {
    console.error(e);
  }
};
