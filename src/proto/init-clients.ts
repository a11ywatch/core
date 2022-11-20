import {
  createMavClient,
  createPageMindClient,
  createCrawlerClient,
} from "./website-client";

// start the grpc clients and retry the connection
export const startClientsGRPC = async () => {
  const clients = await Promise.all([createCrawlerClient(), createMavClient(), createPageMindClient()])
  console.log("gRPC clients connected - pagemind, crawler, and mav.");
  clients
};
