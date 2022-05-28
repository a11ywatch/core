import { connect } from "@app/database";
import { websiteSearchParams } from "@app/core/utils";
import { logPage } from "./ga";

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
});
