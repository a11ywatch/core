const { createPubSub } = require("../../../database/pubsub");
const { initDbConnection } = require("../../../database/client");
const { initRedisConnection } = require("../../../database/memory-client");
const { websiteWatch } = require("./watch-pages");

process.on("message", async function ({ pages }) {
  console.log(`worker script with ${pages.length} to process`);

  try {
    await initDbConnection();
    await initRedisConnection();
    // TODO: REFACTOR PUBSUB HANDLING
    createPubSub();
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
