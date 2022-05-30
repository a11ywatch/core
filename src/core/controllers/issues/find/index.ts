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

    let issue;

    if (Object.keys(websiteSearchParams).length) {
      issue = await collection.findOne(searchProps);

      // get issues from general bucket
      if (!issue && !noRetries) {
        issue = await collection.findOne({ pageUrl: queryUrl });
      }

      if (!issue && !noRetries) {
        issue = await collection.findOne({
          domain: getHostName(queryUrl),
        });
      }
    }

    return chain ? [issue, collection] : issue;
  } catch (e) {
    console.error(e);
  }
};

export const getIssues = async ({ userId, domain, pageUrl }: any) => {
  try {
    const [collection] = await connect("Issues");

    const searchProps = websiteSearchParams({
      domain: domain || getHostName(pageUrl),
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

// get issues for a user with pagination offsets.
export const getIssuesPaging = async (
  { userId, domain, pageUrl, limit = 100, offset = 0 },
  chain?: boolean
) => {
  try {
    const [collection] = await connect("Issues");

    const searchProps = websiteSearchParams({
      domain: domain || getHostName(pageUrl),
      pageUrl,
      userId,
    });

    const websites = await collection
      .find(searchProps)
      .skip(offset)
      .limit(limit)
      .toArray();

    return chain ? [websites, collection] : websites;
  } catch (e) {
    console.error(e);
  }
};
