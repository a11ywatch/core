import { createServer } from "./website-server";
import { startClientsGRPC } from "./init-clients";

export const startGRPC = () => {
  return new Promise(async (resolve) => {
    await createServer();
    // prevent outside startup for now
    await startClientsGRPC();
    resolve(true);
  });
};
