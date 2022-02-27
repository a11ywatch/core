import { redisClient } from "@app/database";
import { URL } from "url";
import type { Request, Response } from "express";
import { getParams } from "./get-params";
import { createHash } from "crypto";

export const completeCrawlTracker = async (req: Request, res: Response) => {
  const { user_id: userId, domain } = getParams(req.body?.data ?? {});

  if (domain && redisClient) {
    try {
      const urlSource = new URL(domain);
      const hostname = urlSource.hostname;
      const hostHash = createHash("sha256");
      hostHash.update(hostname + "");

      await redisClient.hDel(hostHash.digest("hex"), userId + "");
    } catch (e) {
      console.error(e);
    }
  }

  res.json({ ok: true });
};
