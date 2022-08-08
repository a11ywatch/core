import { crawlTrackingEmitter } from "@app/event";

// multi page scan started
export const scanStart = async (call, callback) => {
  crawlTrackingEmitter.emit("crawl-start", call.request);

  callback(null, {});
};
