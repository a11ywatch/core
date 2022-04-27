import { Server, ServerCredentials, ServiceDefinition } from "@grpc/grpc-js";
import { GRPC_HOST } from "@app/config/rpc";
import { loadProto } from "./website";
import { crawlPageQueue } from "@app/queues/crawl";
import { crawlTrackerInit } from "@app/rest/routes/services/crawler/start-crawl";
import { crawlTrackerComplete } from "@app/rest/routes/services/crawler/complete-crawl";

let server: Server;

export const createServer = async () => {
  const websiteProto = await loadProto();
  server = new Server();

  // rust protobuff needs package defs
  server.addService(
    websiteProto["website.WebsiteService"] as ServiceDefinition,
    {
      // async scan website page
      scanStart: async (call, callback) => {
        // temp remove immediate for non-blocking Crawler
        await crawlTrackerInit(call.request);
        callback(null, {});
      },
      scanEnd: async (call, callback) => {
        // temp remove immediate for non-blocking Crawler
        setImmediate(async () => {
          await crawlTrackerComplete(call.request);
        });
        callback(null, {});
      },
      scan: async (call, callback) => {
        // temp remove immediate for non-blocking Crawler
        setImmediate(async () => {
          await crawlPageQueue({ pages: call?.request?.pages });
        });
        callback(null, {});
      },
    }
  );

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
