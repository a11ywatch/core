import { scanWebsite as scan } from "@app/core/controllers/subdomains/update";

import type { Request, Response } from "express";
import { pubsub } from "@app/database/pubsub";
import { Channels } from "@app/database/config";

// send a redis PUB SUB message to queue for scan
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

// TODO: MOVE TO gRPC [USED INTERNAL ATM with CRAWLER]
const websiteCrawl = async (req: Request, res: Response) => {
  const { data } = req.body;
  if (data) {
    await crawlQueue(data);
  }
  res.send(true);
};

const scanWebsite = async (req, res) => {
  const url = req.query?.websiteUrl ?? req.body?.websiteUrl;
  const userId = req.query?.userId ?? req.body?.userId;
  let data;

  if (url) {
    try {
      data = await scan({
        url,
        userId,
      });
    } catch (e) {
      console.error(e);
    }
  }

  if (data) {
    res.json(data);
  } else {
    const source = url
      ? {
          message: "Error: Page not found",
          status: 404,
          success: false,
        }
      : {
          message:
            "Error: Url param not found. Add the websiteUrl param and try again",
          status: 400,
          success: false,
        };

    res.json(source);
  }
};

export { scanWebsite, websiteCrawl };
