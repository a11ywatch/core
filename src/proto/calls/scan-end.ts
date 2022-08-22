import { crawlTrackingEmitter } from "@app/event";
import { crawlTrackerComplete } from "@app/web/routes/services/crawler/complete-crawl";
import type { sendUnaryData, ServerWritableStream } from "@grpc/grpc-js";

// multi page scan finished
export const scanEnd = async (
  call: ServerWritableStream<{ domain: string; user_id: number }, {}>,
  callback: sendUnaryData<any>
) => {
  await crawlTrackerComplete(call.request); // TODO: remove - fully handled via events

  crawlTrackingEmitter.emit("crawl-complete", call.request);

  callback(null, {});
};
