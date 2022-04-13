import { Server, ServerCredentials } from "@grpc/grpc-js";
import { GRPC_HOST } from "@app/config/rpc";
import { getProto, getProtoBasic } from "./website";
import { crawlPageQueue } from "@app/queues/crawl";

const pages = [
  { id: "1", title: "Website 1", content: "Content 1" },
  { id: "2", title: "Website 2", content: "Content 2" },
];

let server: Server;

export const createServer = async () => {
  const websiteProto = await getProtoBasic();
  server = new Server();

  // rust protobuff needs package defs
  server.addService(websiteProto["website.WebsiteService"] as any, {
    // TODO: REMOVE
    list: (_, callback) => {
      callback(null, { websites: pages });
    },
    // TODO: REMOVE
    insert: (call, callback) => {
      let page = call.request;
      pages.push(page);
      callback(null, page);
    },
    scan: async (call, callback) => {
      let page = call.request;
      await crawlPageQueue(page);
      callback(null, {});
    },
  });

  server.bindAsync(GRPC_HOST, ServerCredentials.createInsecure(), () => {
    server.start();
    console.log("Server running at http://[::0]:50051");
  });
};

export const killServer = async () => {
  const websiteProto = await getProto();
  server.removeService(websiteProto.WebsiteService.service);
  server.forceShutdown();
};
