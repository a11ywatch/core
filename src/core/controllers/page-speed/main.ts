import { pageSpeedCollection } from "../../../database";
import { domainNameFind, websiteSearchParams } from "../../utils";

// get analytics by domain for a user with pagination offsets.
export const getPageSpeedPaging = async (p, chain?: boolean) => {
  const { userId, domain, limit = 20, offset = 0, all = false } = p ?? {};

  let params = {};

  if (typeof userId !== "undefined") {
    params = { userId };
  }

  if (typeof domain !== "undefined" && domain) {
    if (all) {
      params = domainNameFind(params, domain);
    } else {
      params = { ...params, domain };
    }
  }

  const pages = await pageSpeedCollection
    .find(params)
    .skip(offset)
    .limit(limit)
    .toArray();

  return chain ? [pages, pageSpeedCollection] : pages;
};

// PageSpeed insights by lighthouse
// returns stringified json results if found.
export const PageSpeedController = () => ({
  getWebsite: async (
    {
      pageUrl,
      userId,
      domain,
      all = false,
    }: { pageUrl?: string; userId?: number; domain?: string; all?: boolean },
    chain?: boolean
  ) => {
    const searchProps = websiteSearchParams({
      pageUrl,
      userId,
      domain,
      all,
    });

    let insights = null;

    if (Object.keys(searchProps).length) {
      insights = await pageSpeedCollection.findOne(searchProps);
    }

    return chain ? [insights, pageSpeedCollection] : insights;
  },
  // get page speed by domain relating to a website.
  getWebsitePageSpeed: async ({
    userId,
    domain,
    pageUrl,
  }: {
    userId?: number;
    domain?: string;
    pageUrl?: string;
  }) => {
    const searchProps = websiteSearchParams({ pageUrl, domain, userId });

    return await pageSpeedCollection.findOne(searchProps);
  },
  getPageSpeedPaging,
});
