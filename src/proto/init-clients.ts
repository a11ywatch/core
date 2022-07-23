import {
  createMavClient,
  createPageMindClient,
  createCrawlerClient,
} from "./website-client";

export const startClientsGRPC = async (retry?: boolean) => {
  return new Promise(async (resolve) => {
    setTimeout(async () => {
      try {
        await createCrawlerClient();
        await createMavClient();
        await createPageMindClient();
        console.log("gRPC clients connected - pagemind, crawler, and mav.");
      } catch (e) {
        console.error(e);
        // try connection assume clients are all connected. TODO: remove HTTP health checks for gRPC.
        if (!retry) {
          console.log("retrying gRPC client connections");
          return await startClientsGRPC(true);
        }
      }

      resolve(true);
    }, 0);
  });
};
