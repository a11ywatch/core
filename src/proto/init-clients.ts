import {
  createMavClient,
  createPageMindClient,
  createCrawlerClient,
  createCDNClient,
} from "./website-client";

// start the grpc clients and retry the connection
export const startClientsGRPC = async () => {
  await Promise.all([
    createCrawlerClient(),
    createMavClient(),
    createPageMindClient(),
    createCDNClient(),
  ]);
  console.log("gRPC clients connected - pagemind, crawler, cdn, and mav.");
};
