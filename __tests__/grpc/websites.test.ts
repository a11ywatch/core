import { listWebsites, createClient } from "@app/proto/website-client";
import { createServer } from "@app/proto/website-server";

describe("gRPC websites", () => {
  beforeAll(async () => {
    await createServer();
    await createClient();
  });
  test("websites rpc", async () => {
    const { websites } = await listWebsites();

    expect(websites.length).toBe(2);
  });
});
