import { connect } from "../../../../database";
import { websiteSearchParams } from "../../../utils";
import { PageSpeedController } from "../../page-speed/main";
import { validateUID } from "../../../../web/params/extracter";
import type { Website } from "../../../../types/types";

/*
 * get a website from the database
 * @params {userId: number, url: string, domain, string} - the query params to run
 * @returns Promise<[website, collection]>
 */
export const getWebsite = async ({
  userId,
  url,
  domain,
}: Website): Promise<[Website, any]> => {
  const params = websiteSearchParams({
    userId,
    url,
    domain,
  });
  const [collection] = connect("Websites");

  const website = (await collection.findOne(params)) as Website;

  return [website, collection];
};

// wrapper for data

export const getWebsiteWrapper = async (params) => {
  const [website] = await getWebsite(params);

  return website;
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
  const [collection] = connect("Websites");
  return [
    await collection
      .find({ userId: { $gte: 0, $ne: -1 }, ...filter })
      .project({ url: 1, userId: 1 })
      .limit(userLimit)
      .toArray(),
    collection,
  ];
};

/*
 * Paginated list of websites by authentiated users.
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
  const [collection] = connect("Websites");

  // websites stored only contain users
  const data = await collection
    .find({ ...filter })
    .sort({ order: 1 }) // todo: optional sorting
    .project({ url: 1, userId: 1, subdomains: 1, tld: 1 })
    .limit(limit)
    .skip(offset ?? limit * page)
    .toArray();

  return [data, collection];
};

// get websites for a user with pagination offsets.
export const getWebsitesPaging = async (
  { userId, limit = 3, offset = 0, insights = false },
  chain?: boolean
) => {
  const [collection] = connect("Websites");
  const webPages = await collection
    .find(validateUID(userId) ? { userId } : undefined)
    .sort({ order: 1 })
    .skip(offset)
    .limit(limit)
    .toArray();

  // run with insight relationship
  if (insights) {
    for (let i = 0; i < webPages.length; i++) {
      const { json } =
        (await PageSpeedController().getWebsite({
          userId,
          ...webPages[i],
        })) ?? {};

      if (json) {
        webPages[i].insight = { json };
      }
    }
  }

  return chain ? [webPages, collection] : webPages;
};

// return a list of websites for the user by 20
export const getWebsites = async ({ userId }, chain?: boolean) => {
  const [collection] = connect("Websites");

  const websites = await collection.find({ userId }).limit(20).toArray();

  return chain ? [websites, collection] : websites;
};
