import type { Request, Response } from "express";
import { pubsub } from "@app/database/pubsub";
import { Channels } from "@app/database/config";

// TODO: move out of file
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

// Send website to crawler queue
const websiteCrawl = async (req: Request, res: Response) => {
  const { data } = req.body;
  if (data) {
    await crawlQueue(data);
  }
  res.send(true);
};

export { websiteCrawl };
