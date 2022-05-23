import { Server, ServerCredentials, ServiceDefinition } from "@grpc/grpc-js";
import { GRPC_HOST } from "@app/config/rpc";
import { crawlMultiSiteQueue } from "@app/queues/crawl/crawl";
import { crawlWebsite } from "@app/core/actions";

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
      // async scan website page start track user
      scanStart: async (call, callback) => {
        // temp remove immediate for non-blocking Crawler
        await crawlTrackerInit(call.request);
        callback(null, {});
      },
      // remove user from crawl and generate average scores
      scanEnd: async (call, callback) => {
        // temp remove immediate for non-blocking Crawler
        setImmediate(async () => {
          await crawlTrackerComplete(call.request);
        });
        callback(null, {});
      },
      scan: async (call, callback) => {
        const { pages: p, user_id: userId, domain, full } = call?.request ?? {};

        const pages = p ?? [];

        setImmediate(async () => {
          // full scan was commenced and all links are sent.
          if (full) {
            let allPageIssues = [];
            let sendEmail = false;

            try {
              // all page issues
              allPageIssues = await crawlMultiSiteQueue({
                pages,
                userId,
              });
            } catch (e) {
              console.error(e);
            }

            try {
              // determine if email should be send if not event
              sendEmail = crawlEmitter.emit(
                `crawl-${domain}-${userId || 0}`,
                domain,
                allPageIssues
              );
            } catch (e) {
              console.error(e);
            }

            try {
              await emailMessager.sendMailMultiPage({
                userId,
                data: allPageIssues,
                domain,
                sendEmail: !sendEmail, // if the event did not emit send email from CRON.
              });
            } catch (e) {
              console.error(e);
            }

            return;
          }

          // Single link sent real time. TODO: add events for stream api/crawl-stream endpoint.
          if (pages.length === 1) {
            try {
              await crawlWebsite({ url: pages[0] });
            } catch (e) {
              console.error(e);
            }
          }
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
