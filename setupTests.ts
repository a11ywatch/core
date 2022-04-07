import { initDbConnection, closeDbConnection } from "@app/database";

beforeAll(async () => {
  await initDbConnection();
});

afterAll(async () => {
  await closeDbConnection();
});
