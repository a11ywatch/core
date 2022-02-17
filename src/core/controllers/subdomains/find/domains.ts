/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import { connect } from "@app/database";
import { websiteSearchParams } from "@app/core/utils";
import { getHostName } from "@a11ywatch/website-source-builder";

export const getDomains = async (
  { domain, userId, url }: { domain?: string; userId?: number; url?: string },
  chain?: boolean
) => {
  try {
    const [collection] = await connect("SubDomains");
    const searchProps = websiteSearchParams({
      userId,
      domain: domain || (url && getHostName(url)),
    });
    const websitesCollection = await collection
      .find(searchProps)
      .limit(100)
      .toArray();

    // TODO: REPLACE FOR MIGRATION | interface resolver
    const websites = websitesCollection?.map((website) => {
      if (typeof website?.pageInsights === "undefined") {
        website.pageInsights = false;
      }
      if (typeof website?.insight === "undefined") {
        website.insight = null;
      }
      return website;
    });

    return chain ? [websites, collection] : websites;
  } catch (e) {
    console.error(e);
  }
};

export const getDomain = async (
  { userId, url }: { userId?: number; url?: string },
  chain?: boolean
) => {
  try {
    const [collection] = await connect("SubDomains");
    const searchProps = websiteSearchParams({ url, userId });
    const website = await collection.findOne(searchProps);

    if (website) {
      if (typeof website?.pageInsights === "undefined") {
        website.pageInsights = false;
      }
      if (typeof website?.insight === "undefined") {
        website.insight = null;
      }
    }

    return chain ? [website, collection] : website;
  } catch (e) {
    console.error(e);
  }
};
