const { createPubSub } = require("@app/core/graph/subscriptions");
const { initDbConnection } = require("@app/database/client");
const { initRedisConnection } = require("@app/database/memory-client");
const { websiteWatch } = require("./watch-pages");

process.on("message", async function ({ pages }) {
  try {
    await initDbConnection();
    await initRedisConnection();
    await createPubSub();
  } catch (e) {
    console.error(e);
  }

  try {
    await websiteWatch(pages);
    process.exit(0);
  } catch (e) {
    console.error(e);
  }
});
