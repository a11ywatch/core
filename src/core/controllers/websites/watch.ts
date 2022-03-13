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

export const crawlAllAuthedWebsites = async (
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

    pageChunk.forEach(async (chunk: any) => {
      await websiteWatch(chunk);
      // const forked = fork(`${__dirname}/watch-forked`, [], forkArgs);
      // forked.send({ pages: chunk });
      // forked.unref();

      // forked.on("message", (message: string) => {
      //   if (message === "close") {
      //     forked.kill("SIGINT");
      //   }
      // });
    });
  } catch (e) {
    console.error(e);
  }

  if (res && "send" in res) {
    res.send(true);
  }
};
