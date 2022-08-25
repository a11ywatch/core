import type { sendUnaryData, ServerWritableStream } from "@grpc/grpc-js";
import { crawlTrackingEmitter } from "../../event";
import { crawlTrackerComplete } from "../../web/routes/services/crawler/complete-crawl";

// multi page scan finished
export const scanEnd = async (
  call: ServerWritableStream<{ domain: string; user_id: number }, {}>,
  callback: sendUnaryData<any>
) => {
  await crawlTrackerComplete(call.request); // TODO: remove - fully handled via events

  crawlTrackingEmitter.emit("crawl-complete", call.request);

  callback(null, {});
};
