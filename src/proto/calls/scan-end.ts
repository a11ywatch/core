import type { sendUnaryData, ServerWritableStream } from "@grpc/grpc-js";
import { crawlTrackingEmitter } from "../../event";

// multi page scan finished
export const scanEnd = async (
  call: ServerWritableStream<{ domain: string; user_id: number }, {}>,
  callback: sendUnaryData<any>
) => {
  crawlTrackingEmitter.emit("crawl-complete", call.request);
  callback(null, {});
};
