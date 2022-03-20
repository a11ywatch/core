const { createPubSub } = require("../graph/subscriptions");
const { initDbConnection, initRedisConnection } = require("../../database");
const { websiteCrawl } = require("../../rest/routes/crawl");

process.on("message", (props) => {
  Promise.all([
    initDbConnection(),
    initRedisConnection(),
    createPubSub(),
    websiteCrawl(props.req),
  ])
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      process.send("close");
    });
});
