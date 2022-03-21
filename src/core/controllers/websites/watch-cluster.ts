import { cpus } from "os";
import path from "path";
import Piscina from "piscina";
import { getWebsitesWithUsers } from "../websites";
import type { Response, Request } from "express";

const piscina = new Piscina({
  filename: path.resolve(__dirname, "watch_worker.js"),
  // @ts-ignore
  env: process.env,
});

const baseCpus = Math.max(cpus().length, 1);
const numCPUs = Math.max(Math.floor(baseCpus / 2), 1);

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

  pageChunk.forEach(async (chunk: any) => {
    console.log(`chunks to process ${pageChunk.length}`);
    try {
      await piscina.run({ pages: chunk });
    } catch (e) {
      console.error(e);
    }
  });

  if (res && "send" in res) {
    res.send(true);
  }
};
