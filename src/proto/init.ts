import { createServer } from "./website-server";
import { startClientsGRPC } from "./init-clients";

export const startGRPC = async () => {
  await createServer();
  return new Promise(async (resolve) => {
    // prevent outside startup for now
    await startClientsGRPC();
    resolve(true);
  });
};
