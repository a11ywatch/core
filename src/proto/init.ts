import { createClient } from "./website-client";
import { createServer } from "./website-server";

export const startGRPC = async () => {
  await createServer();
  await createClient();
};
