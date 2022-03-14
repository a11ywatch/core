import { cpus } from "os";
// import { fork } from "child_process";
// import { DEV } from "@app/config/config";
import { getWebsitesWithUsers } from "../websites";
import type { Response, Request } from "express";
import { websiteWatch } from "./watch-pages";

const baseCpus = Math.max(cpus().length, 1);
const numCPUs = Math.max(Math.floor(baseCpus / 2), 1);

// const forkArgs = {
//   detached: true,
//   execArgv: DEV
//     ? ["-r", "ts-node/register", "-r", "tsconfig-paths/register"]
//     : undefined,
// };

export const crawlAllAuthedWebsitesFork = async (
  _?: Request,
  res?: Response
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
      allWebPages.splice(
        0,
        Math.max(Math.round(allWebPages.length / numCPUs), numCPUs)
      )
    );
  }

  try {
    console.log(`chunks to process ${pageChunk.length}`);
    await websiteWatch(allWebPages);
  } catch (e) {
    console.error(e);
  }

  if (res && "send" in res) {
    res.send(true);
  }
};
