/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import { redisClient } from "@app/database";
import { URL } from "url";
import type { Request, Response } from "express";
import { getParams } from "./get-params";
import { createHash } from "crypto";

export const startCrawlTracker = async (req: Request, res: Response) => {
  const { user_id: userId, domain } = getParams(req.body?.data ?? {});

  if (domain && redisClient) {
    try {
      const urlSource = new URL(domain);
      const hostname = urlSource.hostname;

      const hostHash = createHash("sha256");
      hostHash.update(hostname + "");

      await redisClient.hSet(hostHash.digest("hex"), userId + "", "1");
    } catch (e) {
      console.error(e);
    }
  }

  res.json({ ok: true });
};
