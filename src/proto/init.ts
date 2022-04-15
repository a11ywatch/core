import {
  // createClient,
  createMavClient,
  createPageMindClient,
  createCrawlerClient,
} from "./website-client";
import { createServer } from "./website-server";

export const startGRPC = async () => {
  await createServer();
  // await createClient(); // app client

  // prevent outside startup for now
  if (process.env.NODE_ENV !== "test") {
    await createPageMindClient();
    await createCrawlerClient();
    await createMavClient();
  }
};
