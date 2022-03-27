import { redisClient } from "@app/database";
import type { Request, Response } from "express";
import { getParams } from "./get-params";
import { hashString } from "@app/core/utils";
import { getHostName } from "@app/core/utils";

export const completeCrawlTracker = async (req: Request, res: Response) => {
  const { user_id: userId, domain } = getParams(req.body?.data ?? {});

  if (domain && redisClient) {
    try {
      const bareHost = getHostName(domain);
      const hostHash = hashString(bareHost);

      await redisClient.hdel(hostHash, userId + "");
    } catch (e) {
      console.error(e);
    }
  }

  res.json({ ok: true });
};
