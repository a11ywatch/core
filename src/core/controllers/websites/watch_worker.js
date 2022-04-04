const { initDbConnection } = require("../../../database/client");
const { initRedisConnection } = require("../../../database/memory-client");
const { websiteWatch } = require("./watch-pages");

process.on("message", async function ({ pages }) {
  console.log(`worker script with ${pages.length} to process`);

  try {
    await initDbConnection();
    await initRedisConnection();
  } catch (e) {
    console.error(e);
  }

  try {
    await websiteWatch(pages);
  } catch (e) {
    console.error(e);
  }

  process.send("close");
});
