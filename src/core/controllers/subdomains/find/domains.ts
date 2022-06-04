import { connect } from "@app/database";
import { getHostName, websiteSearchParams } from "@app/core/utils";

export const getDomains = async (
  { domain, userId, url }: { domain?: string; userId?: number; url?: string },
  chain?: boolean
) => {
  try {
    const [collection] = await connect("Pages");
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

// Get the page from the collection
// @example await getDomain({userID: 2}) // returns Pages collection and not Website
export const getDomain = async (
  { userId, url }: { userId?: number; url?: string },
  chain?: boolean
) => {
  try {
    const [collection] = await connect("Pages");
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
    const [collection] = await connect("Pages");

    // TODO: ADD PAGINATION
    const websites = await collection.find({}).limit(0).toArray();

    return [websites, collection];
  } catch (e) {
    console.error(e);
  }
};

// get websites for a user with pagination offsets.
export const getPagesPaging = async (
  {
    userId,
    domain,
    limit = 5,
    offset = 0,
  }: { userId?: number; domain?: string; limit: number; offset: number },
  chain?: boolean
) => {
  try {
    const [collection] = await connect("Pages");

    let params = {};

    if (typeof userId !== "undefined") {
      params = { userId };
    }
    if (typeof domain !== "undefined" && domain) {
      params = { ...params, domain };
    }

    const pages = await collection
      .find(params)
      .skip(offset)
      .limit(limit)
      .toArray();

    return chain ? [pages, collection] : pages;
  } catch (e) {
    console.error(e);
  }
};
