import type { sendUnaryData, ServerWritableStream } from "@grpc/grpc-js";
import { crawlTrackingEmitter } from "../../event";

// multi page scan started
export const scanStart = async (
  call: ServerWritableStream<{ domain: string; user_id: number }, {}>,
  callback: sendUnaryData<any>
) => {
  crawlTrackingEmitter.emit("crawl-start", call.request);

  callback(null, {});
};
