import { Server, ServerCredentials, ServiceDefinition } from "@grpc/grpc-js";
import { GRPC_HOST } from "@app/config/rpc";
import { crawlMultiSite, crawlEnqueue } from "@app/queues/crawl/crawl";
import { crawlTrackerInit } from "@app/rest/routes/services/crawler/start-crawl";
import { crawlTrackerComplete } from "@app/rest/routes/services/crawler/complete-crawl";
import { emailMessager } from "@app/core/messagers";
import { crawlEmitter } from "@app/event/crawl";

import { loadProto } from "./website";

let server: Server;

export const createServer = async () => {
  const websiteProto = await loadProto();
  server = new Server();

  // rust protobuff needs package defs
  server.addService(
    websiteProto["website.WebsiteService"] as ServiceDefinition,
    {
      // async scan website page start track user [TODO: move to stream]
      scanStart: async (call, callback) => {
        try {
          await crawlTrackerInit(call.request);
        } catch (e) {
          console.error(e);
        }
        callback(null, {});
      },
      // remove user from crawl and generate average scores. [TODO: move to stream]
      scanEnd: async (call, callback) => {
        try {
          await crawlTrackerComplete(call.request);
        } catch (e) {
          console.error(e);
        }
        callback(null, {});
      },
      // scan website for issues - syncs with crawl finished. [TODO: move to stream client streaming START, PROCESS, END ]
      scan: async (call, callback) => {
        const {
          pages = [],
          user_id: userId,
          domain,
          full,
        } = call?.request ?? {};

        // the collection of issues found for page scans.
        let data = [];

        try {
          // perform scans across all website urls.
          data = await crawlMultiSite({
            pages,
            userId,
          });
        } catch (e) {
          console.error(e);
        }

        // a full site wide-scan performed. Send scan event including email.
        if (full) {
          try {
            const emitCrawledEvent = crawlEmitter.emit(
              `crawl-${domain}-${userId || 0}`,
              domain,
              data
            );
            await emailMessager.sendMailMultiPage({
              userId,
              data,
              domain,
              sendEmail: !emitCrawledEvent, // if the event did not emit send email from CRON job.
            });
          } catch (e) {
            console.error(e);
          }
        }

        callback(null, {});
      },
      // scan website for issues that pushes task into queues.
      scanStream: async (call) => {
        call.write({});
        call.end();

        try {
          // user queue to control cors output.
          await crawlEnqueue(call?.request);
        } catch (e) {
          console.error(e);
        }
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
