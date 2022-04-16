import { redisClient } from "@app/database";
import type { Request, Response } from "express";
import { getParams } from "./get-params";
import { hashString } from "@app/core/utils";
import { getHostName } from "@app/core/utils/get-host";

export const crawlTrackerInit = async (data = {}) => {
  const { user_id: userId, domain } = getParams(data);

  if (domain && redisClient) {
    try {
      const bareHost = getHostName(domain);
      const hostHash = hashString(bareHost);

      await redisClient.hset(hostHash, userId + "", "1");
    } catch (e) {
      console.error(e);
    }
  }
};

export const startCrawlTracker = async (req: Request, res: Response) => {
  try {
    await crawlTrackerInit(req?.body?.data);
  } catch (e) {
    console.error(e);
  }

  res.json({ ok: true });
};
