import { createServer, killServer } from "@app/proto/website-server";

describe("gRPC websites", () => {
  test("can start and stop server", async () => {
    await createServer();
    await killServer();
  });
});
