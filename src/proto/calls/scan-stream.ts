import { crawlTrackingEmitter } from "@app/event";
import { crawlEnqueue } from "@app/queues/crawl";

// perform scan via streams enqueueing scan
export const scanStream = async (call) => {
  // pass in call to determine if crawl needs to stop
  crawlTrackingEmitter.emit("crawl-processing", call);

  // user queue to control cors output.
  await crawlEnqueue(call?.request);
};
