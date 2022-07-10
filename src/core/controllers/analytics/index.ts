import { connect } from "@app/database";
import { domainNameFind, websiteSearchParams } from "@app/core/utils";
import { logPage } from "./ga";

// get analytics by domain for a user with pagination offsets.
export const getAnalyticsPaging = async (params, chain?: boolean) => {
  const { userId, domain, limit = 20, offset = 0, all = false } = params ?? {};

  try {
    const [collection] = await connect("Analytics");

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

    const items = await collection
      .find(params)
      .skip(offset)
      .limit(limit)
      .toArray();

    const pages = items ?? [];

    return chain ? [pages, collection] : pages;
  } catch (e) {
    console.error(e);
  }
};

export const AnalyticsController = ({ user } = { user: null }) => ({
  logPage,
  getWebsite: async (
    {
      pageUrl,
      userId,
      domain,
    }: { pageUrl?: string; userId?: number; domain?: string },
    chain?: boolean
  ) => {
    const [collection] = await connect("Analytics");
    const searchProps = websiteSearchParams({ pageUrl, userId, domain });
    let analytics;

    if (Object.keys(searchProps).length) {
      try {
        analytics = await collection.findOne(searchProps);
      } catch (e) {
        console.error(e);
      }
    }

    return chain ? [analytics, collection] : analytics;
  },
  getWebsiteAnalytics: async ({
    userId,
    domain,
  }: {
    userId?: number;
    domain?: string;
  }) => {
    const [collection] = await connect("Analytics");
    const searchProps = websiteSearchParams({ domain, userId });
    return await collection.find(searchProps).limit(0).toArray();
  },
  getAnalytics: async ({
    userId,
    pageUrl,
  }: {
    userId?: number;
    pageUrl?: string;
  }) => {
    const [collection] = await connect("Analytics");
    const searchProps = websiteSearchParams({ pageUrl, userId });
    return await collection.find(searchProps).limit(20).toArray();
  },
  getAnalyticsPaging,
});
