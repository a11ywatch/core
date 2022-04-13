import { sub } from "./pubsub";
import { Channels } from "./config";
import { crawlPageQueue } from "@app/queues/crawl";

// REDIS channels pub sub for application
export const setChannels = () => {
  sub.subscribe(Channels.crawl_scan_queue, (err?: any, count?: any) => {
    if (err) {
      console.error("Failed to subscribe: %s", err.message);
    } else {
      console.log(
        `Subscribed successfully! This client is currently subscribed to ${count} channels.`
      );
    }
  });

  sub.on("message", async (channel, message) => {
    if (channel === Channels.crawl_scan_queue) {
      await crawlPageQueue(message);
    }
  });
};
