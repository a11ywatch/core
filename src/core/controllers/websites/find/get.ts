import { connect } from "@app/database";
import { websiteSearchParams } from "@app/core/utils";
import type { Website } from "@app/types";

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
    const website = await collection.findOne(params);

    return [website, collection];
  } catch (e) {
    console.error(e);
  }
};

export const getWebsitesCrawler = async (
  { userId, domain }: { userId?: any; domain?: string },
  chain?: boolean
): Promise<Website[] | [Website[], any]> => {
  try {
    const [collection] = await connect("Websites");
    const websites = await collection
      .find({
        domain,
        userId: typeof userId !== "undefined" ? userId : { $gt: 0 },
      })
      .limit(100)
      .toArray();

    return chain ? [websites, collection] : websites;
  } catch (e) {
    console.error(e);
  }
};

/*
 * Get all the current users of the application
 * @param [userLimit] a limit of users count: number
 * [Promise]: Partial<Website[]>
 */
export const getWebsitesWithUsers = async (
  userLimit = 20
): Promise<Website[]> => {
  try {
    const [collection] = await connect("Websites");
    return await collection
      .find({ userId: { $gt: -1 } })
      .project({ url: 1, userId: 1 })
      .limit(userLimit)
      .toArray();
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const getWebsites = async ({ userId }, chain?: boolean) => {
  try {
    const [collection] = await connect("Websites");
    const websites = await collection.find({ userId }).limit(20).toArray();

    return chain ? [websites, collection] : websites;
  } catch (e) {
    console.error(e);
  }
};

export const getWebsitesDaily = async (page?: number, chain?: boolean) => {
  try {
    const [collection] = await connect("Websites");
    const websites = await collection
      .find({
        screenshotStill: { $exists: true, $ne: undefined },
        adaScore: { $gte: 40 },
      })
      .skip(page * 8)
      .project({ screenshotStill: 1, url: 1, _id: 0 })
      .limit(8)
      .toArray();

    return chain ? [websites, collection] : websites;
  } catch (e) {
    console.error(e);
  }
};
