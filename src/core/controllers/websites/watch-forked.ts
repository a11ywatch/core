/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import { initDbConnection } from "@app/database";
import { websiteWatch } from "./watch-pages";

process.on("message", async () => {
  try {
    await initDbConnection();
    await websiteWatch();
  } catch (e) {
    console.error(e);
  } finally {
    process.send("close");
  }
});
