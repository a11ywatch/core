import { createServer } from "./website-server";
import { startClientsGRPC } from "./init-clients";

export const startGRPC = async () => {
  await createServer();
  // await createClient(); // app client
  // prevent outside startup for now
  await startClientsGRPC();
};
