import { validateUID } from "../../../web/params/extracter";
import { analyticsCollection } from "../../../database";
import { domainNameFind, websiteSearchParams } from "../../utils";
import type { Analytic } from "../../../types/schema";
import { Collection, Document } from "mongodb";

// analytics base params
type BaseParams = {
  userId?: number;
  domain?: string;
  pageUrl?: string;
};

// get analytics by domain for a user with pagination offsets.
export const getAnalyticsPaging = async (
  params,
  chain?: boolean
): Promise<[Analytic[], Collection<Document>] | Analytic[]> => {
  const { userId, domain, limit = 20, offset = 0, all = false } = params ?? {};

  let filters = {};

  if (validateUID(userId)) {
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
    const pages = (await analyticsCollection
      .find(filters)
      .skip(offset)
      .limit(limit)
      .toArray()) as Analytic[];

    return chain ? [pages, analyticsCollection] : pages;
  } catch (e) {
    console.error(e);
    return chain ? [[], analyticsCollection] : [];
  }
};

// Page analytics for simple error stats
export const AnalyticsController = ({ user } = { user: null }) => ({
  getCollection: analyticsCollection,
  getWebsite: async (
    { pageUrl, userId, domain, bypass }: BaseParams & { bypass?: boolean },
    chain?: boolean
  ) => {
    const searchProps = websiteSearchParams({ pageUrl, userId, domain });

    let analytics = null;

    if (validateUID(userId) || bypass) {
      analytics = await analyticsCollection.findOne(searchProps);
    }

    return chain ? [analytics, analyticsCollection] : analytics;
  },
  getWebsiteAnalytics: async ({ userId, domain }: BaseParams) => {
    const searchProps = websiteSearchParams({ domain, userId });

    return validateUID(userId)
      ? await analyticsCollection.find(searchProps).limit(0).toArray()
      : [];
  },
  getAnalytics: async ({ userId, pageUrl }: BaseParams) => {
    const searchProps = websiteSearchParams({ pageUrl, userId });

    return validateUID(userId)
      ? await analyticsCollection.find(searchProps).limit(20).toArray()
      : [];
  },
  getAnalyticsPaging,
});
