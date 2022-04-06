import request from "supertest";
import { initServer } from "@app/server";

test("root renders properly", async () => {
  const [server] = await initServer();
  const res = await request(server).get("/");
  return expect(res.status).toBe(200);
});
