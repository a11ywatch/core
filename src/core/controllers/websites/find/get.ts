import { connect } from "@app/database";
import { websiteSearchParams } from "@app/core/utils";
import type { Website } from "@app/types";

// get a website from the database
export const getWebsite = async ({
  userId,
  url,
  domain,
}: Website): Promise<[Website, any]> => {
  try {
    const [collection] = await connect("Websites");
    const params = websiteSearchParams({
      userId,
      url,
      domain,
    });
    let website;

    if (Object.keys(params).length) {
      website = await collection.findOne(params);
    }

    return [website, collection];
  } catch (e) {
    console.error(e);

    return [null, null];
  }
};

/*
 * Get all the current users of the application
 * @param [userLimit] a limit of users count: number
 * [Promise]: Partial<Website[]>
 */
export const getWebsitesWithUsers = async (
  userLimit = 20,
  filter = {}
): Promise<[Website[], any]> => {
  try {
    const [collection] = await connect("Websites");
    return [
      await collection
        .find({ userId: { $gte: 0, $ne: -1 }, ...filter })
        .project({ url: 1, userId: 1 })
        .limit(userLimit)
        .toArray(),
      collection,
    ];
  } catch (e) {
    console.error(e);
    return [null, null];
  }
};

/*
 * Get all the current users of the application with pagination. Returns partial results for the website.
 * @param [limit] a limit of users count: number
 * @param [filter] query params
 * @param [page] the page in the collection: number
 *
 * [Promise]: Partial<Website[]>
 */
export const getWebsitesPaginated = async (
  limit: number = 20,
  filter = {},
  page = 0, // page in collection
  offset?: number // use offset to skip
): Promise<[Website[], any]> => {
  let data;
  let collection;

  try {
    [collection] = await connect("Websites");
  } catch (e) {
    console.error(e);
  }

  try {
    data = await collection
      .find({ userId: { $gte: 0, $ne: -1 }, ...filter })
      .sort({ order: 1 })
      .project({ url: 1, userId: 1, subdomains: 1, tld: 1 })
      .limit(limit)
      .skip(offset ?? limit * page)
      .toArray();
  } catch (e) {
    console.error(e);
  }

  return [data, collection];
};

// get websites for a user with pagination offsets.
export const getWebsitesPaging = async (
  { userId, limit = 3, offset = 0 },
  chain?: boolean
) => {
  try {
    const [collection] = await connect("Websites");

    const websites = await collection
      .find({ userId })
      .sort({ order: 1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    return chain ? [websites, collection] : websites;
  } catch (e) {
    console.error(e);
    return [null, null];
  }
};

// return a list of websites for the user by 20
export const getWebsites = async ({ userId }, chain?: boolean) => {
  try {
    const [collection] = await connect("Websites");
    const websites = await collection.find({ userId }).limit(20).toArray();

    return chain ? [websites, collection] : websites;
  } catch (e) {
    console.error(e);
    return [null, null];
  }
};
