import { cpus } from "os";
import path from "path";
import { fork } from "child_process";
import { getWebsitesWithUsers } from "../websites";
import type { Response, Request } from "express";

const baseCpus = Math.max(cpus().length, 1);
const numCPUs = Math.max(Math.floor(baseCpus / 3), 1);

export const crawlAllAuthedWebsitesCluster = async (
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
      allWebPages.splice(0, Math.round(allWebPages.length / numCPUs))
    );
  }

  pageChunk.forEach(async (chunk: any) => {
    console.log(`chunks to process ${pageChunk.length}`);
    const forked = fork("node", [path.resolve(__dirname, "watch_worker.js")], {
      detached: true,
      stdio: "ignore",
    });
    forked.send({ pages: chunk });
    forked.disconnect();
    forked.unref();
  });

  if (res && "send" in res) {
    res.send(true);
  }
};
