import { createPubSub } from "@app/core/graph/subscriptions";
import { initDbConnection } from "@app/database/client";
import { initRedisConnection } from "@app/database/memory-client";
import { websiteWatch } from "./watch-pages";

process.on("message", async ({ pages }) => {
  try {
    await initDbConnection();
  } catch (e) {
    console.error(e);
  }

  try {
    await initRedisConnection();
  } catch (e) {
    console.error(e);
  }

  try {
    await createPubSub();
  } catch (e) {
    console.error(e);
  }

  try {
    await websiteWatch(pages);
  } catch (e) {
    console.error(e);
  } finally {
    process.send("close");
  }
});
