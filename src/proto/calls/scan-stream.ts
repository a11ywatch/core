import { crawlTrackingEmitter } from "@app/event";
import { crawlEnqueue } from "@app/queues/crawl";
import { ServerWritableStream } from "@grpc/grpc-js";

type ScanParams = {
  pages: string[];
  user_id: number;
  domain: string;
  full: boolean;
};

// perform scan via streams enqueueing scan
export const scanStream = async (
  call: ServerWritableStream<ScanParams, {}>
) => {
  // pass in call to determine if crawl needs to stop
  crawlTrackingEmitter.emit("crawl-processing", call);

  await crawlEnqueue(call.request); // queue to control output.

  call.end();
};
