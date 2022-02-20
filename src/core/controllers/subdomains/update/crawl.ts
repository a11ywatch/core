/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import validUrl from "valid-url";
import { sourceBuild } from "@a11ywatch/website-source-builder";
import { ApiResponse, responseModel } from "@app/core/models";
import { redisClient } from "@app/database/memory-client";
import { crawlPage } from "./utils/crawl-page";
import { createHash } from "crypto";

export const crawlWebsite = async (params, sendEmail?: boolean) => {
  const { userId: user_id, url: urlMap } = params ?? {};

  if (
    !validUrl.isUri(urlMap) ||
    (process.env.NODE_ENV === "production" && urlMap?.includes("localhost:"))
  ) {
    return Promise.resolve(responseModel({ msgType: ApiResponse.NotFound }));
  }

  let domainSource = sourceBuild(urlMap, user_id);
  let usersPool = [];

  if (user_id) {
    usersPool.push(user_id);
  }

  if (typeof user_id === "undefined") {
    try {
      const hostHash = createHash("sha256");
      hostHash.update(domainSource?.domain + "");
      usersPool = (await redisClient.HKEYS(hostHash.digest("hex"))) || [];
    } catch (e) {
      console.error(e);
    }
  }

  if (usersPool?.length) {
    for await (const id of usersPool) {
      await crawlPage({ ...params, userId: Number(id) }, sendEmail);
    }
  } else {
    await crawlPage(params, sendEmail);
  }

  return Promise.resolve(responseModel({ msgType: ApiResponse.Success }));
};
