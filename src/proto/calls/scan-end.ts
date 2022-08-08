import { crawlTrackingEmitter } from "@app/event";
import { crawlTrackerComplete } from "@app/web/routes/services/crawler/complete-crawl";

// multi page scan finished
export const scanEnd = async (call, callback) => {
  try {
    await crawlTrackerComplete(call.request);
  } catch (e) {
    console.error(e);
  }

  crawlTrackingEmitter.emit("crawl-complete", call.request);

  callback(null, {});
};
