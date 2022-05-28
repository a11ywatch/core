import type { Request, Response } from "express";
import { pubsub } from "@app/database/pubsub";
import { Channels } from "@app/database/config";
import { getUserFromApiScan } from "@app/core/utils/get-user-data";
import { crawlMultiSiteWithEvent } from "@app/core/utils";
import { responseModel } from "@app/core/models";

// TODO: remove pub sub
export const crawlQueue = async (data) => {
  if (data) {
    try {
      const source = typeof data === "string" ? data : JSON.stringify(data);
      await pubsub.publish(Channels.crawl_scan_queue, source);
    } catch (e) {
      console.error(e);
    }
  }
};

// Send website to crawler queue
const websiteCrawl = async (req: Request, res: Response) => {
  const { data } = req.body;
  if (data) {
    await crawlQueue(data);
  }
  res.send(true);
};

// perform a website crawl coming from express
export const crawlRest = async (req, res) => {
  try {
    const userNext = await getUserFromApiScan(
      req.headers.authorization,
      req,
      res
    );

    if (!!userNext) {
      const url = decodeURIComponent(req.body?.websiteUrl || req.body?.url);

      const { data, message } = await crawlMultiSiteWithEvent({
        url,
        userId: userNext.id,
        scan: false,
      });

      res.json(
        responseModel({
          data,
          message,
        })
      );
    }
  } catch (e) {
    console.error(e);
  }
};

export { websiteCrawl };
