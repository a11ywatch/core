import request from "supertest";
import { startServer, killServer } from "@app/app";

let coreServer;

describe("root", () => {
  beforeAll(async () => {
    [coreServer] = await startServer();
  });
  afterAll((done) => {
    killServer().then(done);
  });

  test("root renders properly", () => {
    request(coreServer).get("/").expect(200);
  });
});
