/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import { connect } from "@app/database";
import { websiteSearchParams } from "@app/core/utils";
import type { Params } from "../website.types";

export const getWebsite = async (
  { userId, url, domain }: Params,
  chain?: boolean
) => {
  try {
    const [collection] = await connect("Websites");
    const params = websiteSearchParams({
      userId,
      url,
      domain,
    });
    const website = await collection.findOne(params);

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

export const getWebsitesCrawler = async (
  { userId, domain }: { userId?: any; domain?: string },
  chain?: boolean
) => {
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

export const getWebsitesWithUsers = async (userLimit = 100000) => {
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
    const websitesCollection = await collection
      .find({ userId })
      .limit(20)
      .toArray();

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
