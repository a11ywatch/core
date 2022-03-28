import { pubsub, redisClient } from "@app/database";
import type { Request, Response } from "express";
import { getParams } from "./get-params";
import { hashString } from "@app/core/utils";
import { getHostName } from "@app/core/utils";
import { Method, Channels } from "@app/database/config";

// COMPLETE FULL CRAWL AND GENERATE WEBSITE AVERARAGES AND ANALYTICS[TODO]
export const completeCrawlTracker = async (req: Request, res: Response) => {
  const { user_id: userId, domain: dm } = getParams(req.body?.data ?? {});

  setImmediate(async () => {
    if (dm) {
      const domain = getHostName(dm);

      if (redisClient) {
        try {
          const hostHash = hashString(domain);

          await redisClient.hdel(hostHash, userId + "");
        } catch (e) {
          console.error(e);
        }
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
  });

  // TODO: GENERATE TOP LEVEL ANALYTICS FOR WEB TOTAL ISSUES
  res.json({ ok: true });
};
