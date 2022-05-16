import { getHostName } from "@app/core/utils";
import { redisClient } from "@app/database";
import { hashString } from "@app/core/utils";

type CrawlBasicInfo = {
  urlMap: string;
  userId?: number;
};

// get all users crawling for a domain at a time.
export const getActiveUsersCrawling = async ({
  urlMap,
  userId,
}: CrawlBasicInfo): Promise<string[]> => {
  const usersPool = [];

  const bareHost = getHostName(urlMap);
  const hostHash = hashString(bareHost);

  try {
    const mainPool = await redisClient.hkeys(hostHash);

    usersPool.push(...mainPool);

    // add user to list
    if (typeof userId !== "undefined" && !usersPool.includes(userId)) {
      usersPool.push(userId);
    }
  } catch (e) {
    console.error(e);
  }

  return usersPool;
};
