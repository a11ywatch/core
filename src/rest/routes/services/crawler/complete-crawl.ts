import { redisClient } from "@app/database";
import { getParams } from "./get-params";
import { hashString } from "@app/core/utils";
import { getHostName } from "@app/core/utils";
import { qWebsiteWorker } from "@app/queues/crawl";

export const crawlTrackerComplete = async (data?: any) => {
  const {
    user_id: userId,
    domain: dm,
    full,
  } = typeof data === "string" ? getParams(data) : data;

  if (dm && redisClient) {
    const domain = getHostName(dm);

    try {
      const hostHash = hashString(domain);
      await redisClient.hdel(hostHash, userId + "");
    } catch (e) {
      console.error(e);
    }

    // if a full scan was performed allow performing website averaging.
    if (full) {
      try {
        // send pub sub complete. TODO: remove pub sub since data is already at the container.
        await qWebsiteWorker.push({
          userId,
          meta: {
            extra: { domain },
          },
        });
      } catch (e) {
        console.error(e);
      }
    }
  }
};
