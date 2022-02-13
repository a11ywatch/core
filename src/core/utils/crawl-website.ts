/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/
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
