import { cpus } from "os";
import { DEV } from "@app/config";
import { fork } from "child_process";
import { getWebsitesWithUsers } from "../websites";

export const crawlAllAuthedWebsitesCluster = async (): Promise<void> => {
  let allWebPages = [];
  let pageChunk = [];

  try {
    // TODO: move generate website to queue
    allWebPages = await getWebsitesWithUsers(0);
  } catch (e) {
    console.error(e);
  }

  console.log(`total websites to scan ${allWebPages.length}`);
  const numCPUs = Math.max(Math.floor(cpus().length), 1);
  const numProcesses = Math.floor(allWebPages.length / numCPUs);
  console.log(`processes capable by pages ${numProcesses}`);

  while (allWebPages.length > 0) {
    pageChunk.push(allWebPages.splice(0, numProcesses));
  }

  console.log(`chunks to process ${pageChunk.length}`);

  // TODO: REMOVE LEFTOVER CHUNKS like 11 into group
  pageChunk.forEach((chunk: any) => {
    console.log(`chunk size ${chunk.length}`);
    const forked = fork(`${__dirname}/watch_worker`, [], {
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
};
