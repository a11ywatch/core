import { getWebsitesWithUsers } from "../websites";
import type { Response, Request } from "express";
import { websiteWatch } from "./watch-pages";

export const crawlAllAuthedWebsites = async (
  _?: Request,
  res?: Response
): Promise<any> => {
  let allWebPages = [];

  try {
    allWebPages = await getWebsitesWithUsers();
  } catch (e) {
    console.error(e);
  }

  try {
    console.log("crawling all web pages standby...");
    setImmediate(async () => await websiteWatch(allWebPages));
  } catch (e) {
    console.error(e);
  }

  if (res && "send" in res) {
    res.send(true);
  }
};
