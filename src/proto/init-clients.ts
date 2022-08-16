import {
  createMavClient,
  createPageMindClient,
  createCrawlerClient,
} from "./website-client";

// start the grpc clients and retry the connection
export const startClientsGRPC = async (retried?: boolean) => {
  return new Promise(async (resolve) => {
    try {
      await createCrawlerClient();
      await createMavClient();
      await createPageMindClient();
      console.log("gRPC clients connected - pagemind, crawler, and mav.");
    } catch (e) {
      if (!retried) {
        console.log("retrying gRPC client connections");
        return await startClientsGRPC(true);
      }
      console.error(e);
    }

    resolve(true);
  });
};
