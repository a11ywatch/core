import request from "supertest";
import { initServer } from "@app/app";
import { connectLimiters } from "@app/rest/limiters/scan";

describe("root", () => {
  beforeAll(async () => {
    await connectLimiters();
  });
  test("root renders properly", async () => {
    const [server] = initServer();
    const res = await request(server).get("/");
    return expect(res.status).toBe(200);
  });
});
