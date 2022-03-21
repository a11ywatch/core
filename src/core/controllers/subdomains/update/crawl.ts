import validUrl from "valid-url";
import { createHash } from "crypto";
import { ApiResponse, responseModel } from "@app/core/models";
import { redisClient } from "@app/database/memory-client";
import { getHostName } from "@app/core/utils";
import { crawlPage } from "./utils/crawl-page";

export const crawlWebsite = async (params, sendEmail?: boolean) => {
  const { userId, url: urlMap } = params ?? {};

  if (!validUrl.isUri(urlMap)) {
    return responseModel({ msgType: ApiResponse.NotFound });
  }

  let usersPool = [];

  if (userId) {
    usersPool.push(userId);
  }

  if (userId === undefined) {
    const bareHost = getHostName(urlMap);
    const hostHash = createHash("sha256");
    hostHash.update(bareHost);
    try {
      usersPool = await redisClient.hkeys(hostHash.digest("hex"));
    } catch (e) {
      console.error(e);
    }
  }

  if (usersPool.length) {
    for (const id of usersPool) {
      await crawlPage({ ...params, userId: Number(id) }, sendEmail);
    }
  } else {
    await crawlPage(params, sendEmail);
  }

  return responseModel({ msgType: ApiResponse.Success });
};
