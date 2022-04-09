import { Server, ServerCredentials } from "@grpc/grpc-js";
import { GRPC_HOST } from "@app/config/rpc";
import { getProto } from "./website";

const pages = [
  { id: "1", title: "Website 1", content: "Content 1" },
  { id: "2", title: "Website 2", content: "Content 2" },
];

export const createServer = async () => {
  const websiteProto = await getProto();
  const server = new Server();

  server.addService(websiteProto.WebsiteService.service, {
    list: (_, callback) => {
      callback(null, { websites: pages });
    },
    insert: (call, callback) => {
      let page = call.request;
      pages.push(page);
      callback(null, page);
    },
  });

  server.bindAsync(GRPC_HOST, ServerCredentials.createInsecure(), () => {
    server.start();
    console.log("Server running at http://127.0.0.1:50051");
  });
};
