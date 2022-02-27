import { fork } from "child_process";
import { DEV } from "@app/config";
import { getWebsitesWithUsers } from "../websites";
import { cpus } from "os";
import type { Response, Request } from "express";

export const crawlAllAuthedWebsites = async (
  _?: Request,
  res?: Response
): Promise<any> => {
  let allWebPages = [];
  let pageChunk = [];
  const numCPUs = cpus().length;

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
