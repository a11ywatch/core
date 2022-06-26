import {
  createMavClient,
  createPageMindClient,
  createCrawlerClient,
} from "./website-client";

export const startClientsGRPC = async (retry?: boolean) => {
  // prevent outside startup for now
  return new Promise(async (resolve) => {
    if (process.env.NODE_ENV !== "test") {
      setTimeout(async () => {
        try {
          await createCrawlerClient();
          await createPageMindClient();
          await createMavClient();
          console.log("gRPC clients connected - pagemind, crawler, and mav.");
        } catch (e) {
          console.error(e);
          // try connection assume clients are all connected. TODO: remove HTTP health checks for gRPC.
          if (!retry) {
            return await startClientsGRPC(true);
          }
        }

        resolve(true);
      }, 60);
    } else {
      resolve(true);
    }
  });
};
