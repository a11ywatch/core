import { Server, ServerCredentials, ServiceDefinition } from "@grpc/grpc-js";
import { GRPC_HOST, GRPC_HOST_PUBLIC } from "../config/rpc";
import { scanStart } from "./calls/scan-start";
import { scanEnd } from "./calls/scan-end";
import { scan } from "./calls/scan";
import { scanStream } from "./calls/scan-stream";
import { coreScan } from "./calls/core-scan";
import { pageUpdate } from "./calls/page-update";
import { coreCrawl } from "./calls/core-crawl";
import { loadProto } from "./website";

let server: Server;
let publicServer: Server;

// create a top level gRPC server
export const createServer = async () => {
  const websiteProto = await loadProto(); // crawler handling proto
  const coreProto = await loadProto("apicore.proto");

  server = new Server();
  publicServer = new Server();

  // crawl control website service
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
      // update a page directly after long batch job
      pageSet: pageUpdate,
    }
  );

  publicServer.addService(
    coreProto["apicore.CoreService"] as ServiceDefinition,
    {
      // single page scan and get results
      scan: coreScan,
      // scan multiple pages to stream
      crawl: coreCrawl,
    }
  );

  server.bindAsync(GRPC_HOST, ServerCredentials.createInsecure(), () => {
    server.start();
    console.log(`gRPC server running at ${GRPC_HOST}`);
  });

  publicServer.bindAsync(
    GRPC_HOST_PUBLIC,
    ServerCredentials.createInsecure(),
    () => {
      publicServer.start();
      console.log(`public - gRPC server running at ${GRPC_HOST_PUBLIC}`);
    }
  );
};

export const killServer = async () => {
  const websiteProto = await loadProto();
  const coreProto = await loadProto("apicore.proto");

  server.removeService(
    websiteProto["website.WebsiteService"] as ServiceDefinition
  );

  publicServer.removeService(
    coreProto["apicore.CoreService"] as ServiceDefinition
  );

  server.forceShutdown();
  publicServer.forceShutdown();
};
