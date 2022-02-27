const { initDbConnection, initRedisConnection } = require("../../database");
const { websiteCrawl } = require("../../rest/routes/crawl");

process.on("message", async (props) => {
  try {
    await Promise.all([initDbConnection(), initRedisConnection()]);
    await websiteCrawl(props?.req);
  } catch (e) {
    console.error(e);
  } finally {
    if (process.send) {
      process.send("close");
    }
  }
});
