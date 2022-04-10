import { createClient, killClient } from "@app/proto/website-client";
import { controller } from "@app/proto/actions/calls";
import { createServer, killServer } from "@app/proto/website-server";

const { listWebsites, insertIssue } = controller;

describe("gRPC websites", () => {
  beforeAll(async () => {
    await createServer();
    await createClient(true); // atm simple switch for internal client
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
    const website = await insertIssue(websiteAdd);

    expect(website).toStrictEqual(websiteAdd);
  });
});
