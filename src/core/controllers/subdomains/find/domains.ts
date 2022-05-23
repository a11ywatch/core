import { connect } from "@app/database";
import { getHostName, websiteSearchParams } from "@app/core/utils";

export const getDomains = async (
  { domain, userId, url }: { domain?: string; userId?: number; url?: string },
  chain?: boolean
) => {
  try {
    const [collection] = await connect("SubDomains");
    const searchProps = websiteSearchParams({
      userId,
      domain: domain || (url && getHostName(url)),
    });
    // TODO: ADD PAGINATION
    const websites = await collection
      .find(searchProps)
      .sort({ url: 1 })
      .limit(0)
      .toArray();

    return chain ? [websites, collection] : websites;
  } catch (e) {
    console.error(e);
  }
};

export const getDomain = async (
  { userId, url }: { userId?: number; url?: string },
  chain?: boolean
) => {
  try {
    const [collection] = await connect("SubDomains");
    const searchProps = websiteSearchParams({ url, userId });
    const website = await collection.findOne(searchProps);

    return chain ? [website, collection] : website;
  } catch (e) {
    console.error(e);
  }
};

// get all the pages in the database
export const getAllPages = async () => {
  try {
    const [collection] = await connect("SubDomains");

    // TODO: ADD PAGINATION
    const websites = await collection.find({}).limit(0).toArray();

    return [websites, collection];
  } catch (e) {
    console.error(e);
  }
};
