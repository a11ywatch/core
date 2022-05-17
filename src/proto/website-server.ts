import { Server, ServerCredentials, ServiceDefinition } from "@grpc/grpc-js";
import { GRPC_HOST } from "@app/config/rpc";
import { loadProto } from "./website";
import { crawlMultiSiteQueue } from "@app/queues/crawl/crawl";
import { crawlWebsite } from "@app/core/actions";

import { crawlTrackerInit } from "@app/rest/routes/services/crawler/start-crawl";
import { crawlTrackerComplete } from "@app/rest/routes/services/crawler/complete-crawl";
import { emailMessager } from "@app/core/messagers";

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
          // add delay of 400ms to assume the last page has finished scanning. [TODO: remove delays and better handle async followup via stream]
          setTimeout(async () => {
            await crawlTrackerComplete(call.request);
          }, 400);
        });
        callback(null, {});
      },
      scan: async (call, callback) => {
        const { pages: p, user_id: userId, domain } = call?.request ?? {};

        const pages = p ?? [];

        setImmediate(async () => {
          try {
            if (pages.length > 1) {
              const allPageIssues = await crawlMultiSiteQueue({
                pages,
                userId,
              });

              // TODO: REVISIT  add extra gRPC userID or scan detect flag queue email
              await emailMessager.sendMailMultiPage({
                userId,
                data: allPageIssues,
                domain,
              });
              // TODO: send email follow up. REMOVE from section and to cron specific gRPC endpoints or flags
            } else if (pages.length === 1) {
              await crawlWebsite({ url: pages[0] });
            }
          } catch (e) {
            console.error(e);
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
