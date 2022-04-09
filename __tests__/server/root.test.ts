import request from "supertest";
import { startServer, killServer } from "@app/app";

describe("root", () => {
  beforeAll(async () => {
    startServer();
  });
  afterAll(async () => {
    try {
      await killServer();
    } catch (e) {
      console.error(e);
    }
  });
  test("root renders properly", async () => {
    try {
      const res = await request().get("/");
      return expect(res.status).toBe(200);
    } catch (e) {
      console.error(e);
    }
  });
});
