import validUrl from "valid-url";
import { ApiResponse, responseModel } from "@app/core/models";
import { redisClient } from "@app/database/memory-client";
import { crawlPage } from "./utils/crawl-page";
import { createHash } from "crypto";
import { sourceBuild } from "@a11ywatch/website-source-builder";

export const crawlWebsite = async (params, sendEmail?: boolean) => {
  const { userId: user_id, url: urlMap } = params ?? {};

  if (
    !validUrl.isUri(urlMap) ||
    (process.env.NODE_ENV === "production" && urlMap?.includes("localhost:"))
  ) {
    return Promise.resolve(responseModel({ msgType: ApiResponse.NotFound }));
  }

  let usersPool = [];

  if (user_id) {
    usersPool.push(user_id);
  }

  if (user_id === undefined) {
    try {
      const source = sourceBuild(urlMap);
      const bareHost = source?.domain;
      const hostHash = createHash("sha256");
      hostHash.update(bareHost);
      usersPool = await redisClient.HKEYS(hostHash.digest("hex"));
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
