import { createClient, killClient } from "@app/proto/website-client";
import { createServer, killServer } from "@app/proto/website-server";

describe("gRPC websites", () => {
  test("can start and stop server", async () => {
    await createServer();
    await createClient();
    await killClient();
    await killServer();
  });
});
