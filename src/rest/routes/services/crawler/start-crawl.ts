import { redisClient } from "@app/database";
import type { Request, Response } from "express";
import { getParams } from "./get-params";
import { createHash } from "crypto";
import { getHostName } from "@app/core/utils/get-host";

export const startCrawlTracker = async (req: Request, res: Response) => {
  const { user_id: userId, domain } = getParams(req.body?.data ?? {});

  if (domain && redisClient) {
    try {
      const bareHost = getHostName(domain);
      const hostHash = createHash("sha256");
      hostHash.update(bareHost);

      await redisClient.hSet(hostHash.digest("hex"), userId + "", "1");
    } catch (e) {
      console.error(e);
    }
  }

  res.json({ ok: true });
};
