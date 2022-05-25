import { getHostName } from "@app/core/utils";
import { redisClient } from "@app/database";
import { hashString } from "@app/core/utils";

type CrawlBasicInfo = {
  urlMap: string;
  userId?: number;
};

// get all users crawling for a domain at once.
export const getActiveUsersCrawling = async ({
  urlMap,
  userId,
}: CrawlBasicInfo): Promise<string[]> => {
  const bareHost = getHostName(urlMap);
  const hostHash = bareHost ? hashString(bareHost) : "";

  const usersPool = [];

  if (hostHash) {
    try {
      // TODO: remove pool usage for full async runtime handling
      const mainPool = await redisClient.hkeys(hostHash);
      usersPool.push(...mainPool);
    } catch (e) {
      console.error(e);
    }
  }

  // add user to list
  if (typeof userId !== "undefined" && !usersPool.includes(userId + "")) {
    usersPool.push(userId + "");
  }

  return usersPool;
};
