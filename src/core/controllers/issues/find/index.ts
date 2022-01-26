/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import { connect } from "@app/database";
import { websiteSearchParams } from "@app/core/utils";
import { getHostName } from "@a11ywatch/website-source-builder";

export const getIssue = async (
  { url, pageUrl, userId, noRetries }: any,
  chain?: boolean
) => {
  try {
    const [collection] = await connect("Issues");
    const queryUrl = (url || pageUrl) && decodeURIComponent(url || pageUrl);

    const searchProps = websiteSearchParams({
      pageUrl: queryUrl,
      userId,
    });

    let issue = await collection.findOne(searchProps);

    // get issues from general bucket
    if (!issue && !noRetries) {
      issue = await collection.findOne({ pageUrl: queryUrl });
    }

    if (!issue && !noRetries) {
      issue = await collection.findOne({
        domain: getHostName(queryUrl),
      });
    }

    return chain ? [issue, collection] : issue;
  } catch (e) {
    console.error(e);
  }
};

export const getIssues = async ({
  userId,
  domain,
  pageUrl,
  url,
  filter,
}: any) => {
  try {
    const [collection] = await connect("Issues");

    const queryUrl = (pageUrl || url) && decodeURIComponent(pageUrl || url);

    const searchProps = websiteSearchParams({
      domain: domain || getHostName(queryUrl),
      filter,
      userId,
    });

    return await collection.find(searchProps).limit(1000).toArray();
  } catch (e) {
    console.error(e);
  }
};
