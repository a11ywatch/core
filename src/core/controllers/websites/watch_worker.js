module.exports = async ({ pages }) => {
  const { createPubSub } = require("@app/core/graph/subscriptions");
  const { initDbConnection } = require("@app/database/client");
  const { initRedisConnection } = require("@app/database/memory-client");

  try {
    await initDbConnection();
    await initRedisConnection();
    await createPubSub();
  } catch (e) {
    console.error(e);
  }

  const { websiteWatch } = require("./watch-pages");

  try {
    await websiteWatch(pages);
  } catch (e) {
    console.error(e);
  }
};
