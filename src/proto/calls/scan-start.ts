import { crawlTrackingEmitter } from "@app/event";
import type { sendUnaryData, ServerWritableStream } from "@grpc/grpc-js";

// multi page scan started
export const scanStart = async (
  call: ServerWritableStream<{ domain: string; user_id: number }, {}>,
  callback: sendUnaryData<any>
) => {
  crawlTrackingEmitter.emit("crawl-start", call.request);

  callback(null, {});
};
