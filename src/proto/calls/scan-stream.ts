import type { ServerWritableStream } from "@grpc/grpc-js";
import { crawlEnqueue } from "../../queues/crawl/crawl";
import { crawlTrackingEmitter } from "../../event";

type ScanParams = {
  pages: string[];
  user_id: number;
  domain: string;
  full: boolean;
};

export type ScanRpcCall = ServerWritableStream<ScanParams, {}>;

// perform scan via streams enqueueing scan
export const scanStream = async (rpc: ScanRpcCall) => {
  crawlTrackingEmitter.emit("crawl-processing", rpc); // pass in call to determine if crawl needs to stop
  await crawlEnqueue(rpc.request); // queue to control output.
};
