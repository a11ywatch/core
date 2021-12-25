/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import { fork } from "child_process";
import { DEV } from "@app/config";
import { getWebsitesWithUsers } from "../websites";

export const crawlAllAuthedWebsites = async (
  _?: any,
  res?: any
): Promise<any> => {
  let allWebPages = [];
  let pageChunk = [];

  try {
    allWebPages = await getWebsitesWithUsers();
  } catch (e) {
    console.error(e);
  }

  while (allWebPages.length > 0) {
    pageChunk.push(
      allWebPages.splice(0, Math.max(allWebPages.length / 10, 50))
    );
  }

  try {
    pageChunk.forEach((chunk: any) => {
      const forked = fork(`${__dirname}/watch-forked`, [], {
        detached: true,
        execArgv: DEV
          ? ["-r", "ts-node/register", "-r", "tsconfig-paths/register"]
          : undefined,
      });
      forked.send({ pages: chunk });
      forked.unref();

      forked.on("message", (message: string) => {
        if (message === "close") {
          forked.kill("SIGINT");
        }
      });
    });
  } catch (e) {
    console.error(e);
  }

  if (res && "send" in res) {
    res.send(true);
  }
};
