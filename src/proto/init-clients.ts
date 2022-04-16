import {
  // createClient,
  createMavClient,
  createPageMindClient,
  createCrawlerClient,
} from "./website-client";

export const startClientsGRPC = async () => {
  // prevent outside startup for now
  if (process.env.NODE_ENV !== "test") {
    await createPageMindClient();
    await createCrawlerClient();
    await createMavClient();
  }
};
