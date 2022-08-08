import { Server, ServerCredentials, ServiceDefinition } from "@grpc/grpc-js";
import { GRPC_HOST } from "@app/config/rpc";
import { scanStart } from "./calls/scan-start";
import { scanEnd } from "./calls/scan-end";
import { scan } from "./calls/scan";
import { scanStream } from "./calls/scan-stream";
import { coreScan } from "./calls/core-scan";
import { coreCrawl } from "./calls/core-crawl";

import { loadProto } from "./website";

let server: Server;

export const createServer = async () => {
  const websiteProto = await loadProto();
  const coreProto = await loadProto("apicore.proto");

  server = new Server();

  // rust protobuff needs package defs
  server.addService(
    websiteProto["website.WebsiteService"] as ServiceDefinition,
    {
      // async scan website page start track user
      scanStart,
      // remove user from crawl and generate average scores.
      scanEnd,
      // scan website for issues - syncs with crawl finished. [Used for CRON jobs]
      scan,
      // scan website for issues that pushes task into queues.
      scanStream,
    }
  );

  server.addService(coreProto["apicore.CoreService"] as ServiceDefinition, {
    // single page scan and get results
    scan: coreScan,
    // scan multiple pages to stream
    crawl: coreCrawl,
  });

  server.bindAsync(GRPC_HOST, ServerCredentials.createInsecure(), () => {
    server.start();
    console.log("gRPC server running at http://0.0.0.0:50051");
  });
};

export const killServer = async () => {
  const websiteProto = await loadProto();
  server.removeService(
    websiteProto["website.WebsiteService"] as ServiceDefinition
  );
  server.forceShutdown();
};
