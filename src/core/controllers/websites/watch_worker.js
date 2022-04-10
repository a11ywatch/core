const { initDbConnection } = require("../../../database/client");
const { initRedisConnection } = require("../../../database/memory-client");
const { websiteWatch } = require("./watch-pages");
const { parentPort } = require("worker_threads");

const initConnections = async () => {
  try {
    await initDbConnection();
    await initRedisConnection();
  } catch (e) {
    console.error(e);
  }
};

parentPort.on("message", async (message) => {
  const { websites, exit } = message;

  await initConnections();
  await websiteWatch(websites);

  if (exit) {
    process.exit();
  }
});
