import {
  createClient,
  killClient,
  controller,
} from "@app/proto/website-client";
import { createServer, killServer } from "@app/proto/website-server";

const { listWebsites, insertWebsites } = controller;

describe("gRPC websites", () => {
  beforeAll(async () => {
    await createServer();
    await createClient();
  });
  afterAll(async () => {
    await killClient();
    await killServer();
  });
  test("websites list", async () => {
    const { websites } = await listWebsites();

    expect(websites.length).toBe(2);
  });

  test("websites insert", async () => {
    const websiteAdd = { id: "3", title: "Website 3", content: "Content 3" };
    const website = await insertWebsites(websiteAdd);

    expect(website).toStrictEqual(websiteAdd);
  });
});
