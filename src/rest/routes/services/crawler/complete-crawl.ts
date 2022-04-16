import { pubsub, redisClient } from "@app/database";
import type { Request, Response } from "express";
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
  }
};

// COMPLETE FULL CRAWL AND GENERATE WEBSITE AVERARAGES AND ANALYTICS[TODO]
export const completeCrawlTracker = (req: Request, res: Response) => {
  setImmediate(async () => {
    await crawlTrackerComplete(req?.body?.data);
  });

  // TODO: GENERATE TOP LEVEL ANALYTICS FOR WEB TOTAL ISSUES
  res.json({ ok: true });
};
