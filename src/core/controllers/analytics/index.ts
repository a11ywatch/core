import { connect } from "../../../database";
import { domainNameFind, websiteSearchParams } from "../../utils";

// get analytics by domain for a user with pagination offsets.
export const getAnalyticsPaging = async (params, chain?: boolean) => {
  const { userId, domain, limit = 20, offset = 0, all = false } = params ?? {};
  const [collection] = await connect("Analytics");

  let filters = {};

  if (typeof userId !== "undefined") {
    filters = { userId };
  }

  if (typeof domain !== "undefined" && domain) {
    if (all) {
      filters = domainNameFind(filters, domain);
    } else {
      filters = { ...filters, domain };
    }
  }

  try {
    const pages = await collection
      .find(filters)
      .skip(offset)
      .limit(limit)
      .toArray();

    return chain ? [pages, collection] : pages;
  } catch (e) {
    console.error(e);
    return chain ? [null, collection] : [];
  }
};

// Page analytics for simple error stats
export const AnalyticsController = ({ user } = { user: null }) => ({
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
      analytics = await collection.findOne(searchProps);
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
