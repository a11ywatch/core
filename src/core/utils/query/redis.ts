import { getHostName } from "@app/core/utils";
import { redisClient } from "@app/database";
import { hashString } from "@app/core/utils";

type CrawlBasicInfo = {
  urlMap: string;
  userId?: number;
};

export const getActiveUsersCrawling = async ({
  urlMap,
  userId,
}: CrawlBasicInfo): Promise<string[]> => {
  let usersPool = [];

  if (userId) {
    usersPool.push(userId);
  }

  if (userId === undefined || typeof userId === "undefined") {
    const bareHost = getHostName(urlMap);

    try {
      usersPool = await redisClient.hkeys(hashString(bareHost));
    } catch (e) {
      console.error(e);
    }
  }

  return usersPool;
};