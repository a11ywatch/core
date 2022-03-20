import { createPubSub } from "@app/core/graph/subscriptions";
import { initDbConnection } from "@app/database/client";
import { initRedisConnection } from "@app/database/memory-client";
import { websiteWatch } from "./watch-pages";

// FORKED PROCESS
process.on("message", ({ pages }) => {
  Promise.all([
    initDbConnection(),
    initRedisConnection(),
    createPubSub(),
    websiteWatch(pages),
  ])
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      process.send("close");
    });
});
