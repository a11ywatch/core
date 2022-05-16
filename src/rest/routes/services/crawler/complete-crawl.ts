import { pubsub, redisClient } from "@app/database";
import { getParams } from "./get-params";
import { hashString } from "@app/core/utils";
import { getHostName } from "@app/core/utils";
import { Method, Channels } from "@app/database/config";

export const crawlTrackerComplete = async (data) => {
  const { user_id: userId, domain: dm } =
    typeof data === "string" ? getParams(data) : data;

  if (dm && redisClient) {
    const domain = getHostName(dm);

    try {
      const hostHash = hashString(domain);
      await redisClient.hdel(hostHash, userId + "");
    } catch (e) {
      console.error(e);
    }

    try {
      // send pub sub complete. TODO: remove pub sub since data is already at the container.
      await pubsub.publish(
        Channels.crawl_scan_queue,
        JSON.stringify({
          user_id: userId,
          meta: {
            method: Method["crawl_complete"],
            extra: { domain },
          },
        })
      );
    } catch (e) {
      console.error(e);
    }
  }
};
