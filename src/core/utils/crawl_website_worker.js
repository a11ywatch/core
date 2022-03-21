const { createPubSub } = require("../graph/subscriptions");
const { initDbConnection, initRedisConnection } = require("../../database");
const { websiteCrawl } = require("../../rest/routes/crawl");

module.exports = (props) => {
  Promise.all([
    initDbConnection(),
    initRedisConnection(),
    createPubSub(),
    websiteCrawl(props.req),
  ]).catch((error) => {
    console.error(error);
  });
};
