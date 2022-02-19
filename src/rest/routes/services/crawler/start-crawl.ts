/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import { redisClient } from "@app/database";
import { URL } from "url";
import type { Request, Response } from "express";

export const startCrawlTracker = async (req: Request, res: Response) => {
  const data = req.body?.data ?? {};
  const { user_id: userId, domain } =
    data && typeof data == "string"
      ? JSON.parse(data)
      : { domain: undefined, user_id: undefined };

  if (domain && redisClient) {
    try {
      const urlSource = new URL(domain);
      const hostname = urlSource.hostname;
      const active = await redisClient.get(hostname);
      const activeUsers = active ? JSON.parse(active) : {};

      const newClient = { ...activeUsers, [userId]: 1 };
      await redisClient.set(hostname, `${JSON.stringify(newClient)}`);
    } catch (e) {
      console.error(e);
    }
  }

  res.json({ ok: true });
};
