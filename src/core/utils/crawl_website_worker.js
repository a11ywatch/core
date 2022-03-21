module.exports = async (props) => {
  const { createPubSub } = require("../graph/subscriptions");
  const { initDbConnection, initRedisConnection } = require("../../database");
  const { crawlWebsite } = require("../controllers/subdomains/update/crawl");

  try {
    await initDbConnection();
    await initRedisConnection();
    await createPubSub();
  } catch (e) {
    console.error(e);
  }

  const { data } = props?.req?.body ?? {};

  if (data) {
    try {
      const { user_id, pages } =
        typeof data === "string" ? JSON.parse(data) : data;

      for (const url of pages) {
        await crawlWebsite({
          url,
          userId: user_id,
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  return Promise.resolve();
};
