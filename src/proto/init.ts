import { createServer } from "./website-server";
import { startClientsGRPC } from "./init-clients";

export const startGRPC = async () => {
  await createServer();
  await startClientsGRPC();

};
