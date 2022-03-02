import { redisClient } from "@app/database";
import type { Request, Response } from "express";
import { getParams } from "./get-params";
import { createHash } from "crypto";
import { sourceBuild } from "@a11ywatch/website-source-builder";

export const startCrawlTracker = async (req: Request, res: Response) => {
  const { user_id: userId, domain } = getParams(req.body?.data ?? {});

  if (domain && redisClient) {
    try {
      const source = sourceBuild(domain);
      const bareHost = source?.domain;
      const hostHash = createHash("sha256");
      hostHash.update(bareHost);

      await redisClient.hSet(hostHash.digest("hex"), userId + "", "1");
    } catch (e) {
      console.error(e);
    }
  }

  res.json({ ok: true });
};
