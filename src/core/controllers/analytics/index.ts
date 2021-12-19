/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

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
    chain: boolean
  ) => {
    const [collection] = await connect("Analytics");
    const searchProps = websiteSearchParams({ pageUrl, userId, domain });
    const analytics = await collection.findOne(searchProps);

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
