import { createClient, createPageMindClient } from "./website-client";
import { createServer } from "./website-server";

export const startGRPC = async () => {
  await createServer();
  await createClient();

  // prevent outside startup for now
  if (process.env.NODE_ENV !== "test") {
    await createPageMindClient();
  }
};
