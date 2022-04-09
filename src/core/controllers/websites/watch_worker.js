const { initDbConnection } = require("../../../database/client");
const { initRedisConnection } = require("../../../database/memory-client");
const { websiteWatch } = require("./watch-pages");
const { workerData } = require("worker_threads");

(async function startUp() {
  try {
    await initDbConnection();
    await initRedisConnection();
  } catch (e) {
    console.error(e);
  }

  try {
    await websiteWatch(workerData);
  } catch (e) {
    console.error(e);
  }

  process.exit();
})();
