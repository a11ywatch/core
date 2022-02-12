/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/
import validUrl from "valid-url";
import {
  WEBSITE_EXIST_ERROR,
  ADD_FREE_MAX_ERROR,
  SUCCESS,
  WEBSITE_URL_ERROR,
} from "@app/core/strings";
import {
  forkProcess,
  blockWebsiteAdd,
  stripUrlEndingSlash,
} from "@app/core/utils";
import { makeWebsite } from "@app/core/models/website";
import { getHostName, initUrl } from "@a11ywatch/website-source-builder";
import { getWebsite } from "../find";

export const addWebsite = async ({
  userId,
  url: urlMap,
  customHeaders,
  audience,
  canScan,
}) => {
  if (!validUrl.isUri(urlMap)) {
    throw new Error(WEBSITE_URL_ERROR);
  }
  const url = initUrl(urlMap);
  const [siteExist, collection] = await getWebsite({ userId, url }, true);

  if (siteExist) {
    throw new Error(WEBSITE_EXIST_ERROR);
  }

  const collectionCount = await collection.countDocuments({ userId });

  if (blockWebsiteAdd({ audience, collectionCount })) {
    throw new Error(ADD_FREE_MAX_ERROR);
  }

  const website = makeWebsite({
    userId,
    url,
    domain: getHostName(url),
    pageHeaders: customHeaders,
  });

  await collection.insertOne(website);

  if (canScan) {
    forkProcess({ urlMap: stripUrlEndingSlash(url), userId, scan: false });
  }

  return {
    website,
    code: 200,
    success: !!canScan,
    message: canScan
      ? SUCCESS
      : "Scan limit reached for the day. Upgrade your account or wait until your limit resets tomorrow.",
  };
};
