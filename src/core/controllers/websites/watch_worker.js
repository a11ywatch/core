const { createPubSub } = require("@app/core/graph/subscriptions");
const { initDbConnection } = require("@app/database/client");
const { initRedisConnection } = require("@app/database/memory-client");
const { websiteWatch } = require("./watch-pages");

module.exports = ({ pages }) => {
  Promise.all([
    initDbConnection(),
    initRedisConnection(),
    createPubSub(),
    websiteWatch(pages),
  ]).catch((error) => {
    console.error(error);
  });
};
