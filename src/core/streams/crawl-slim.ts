import type { Request, Response } from "express";
import { crawlStream } from "./crawl";

// Crawl stream with events slim data.
export const crawlStreamSlim = async (req: Request, res: Response, _next) => {
  await crawlStream(req, res, _next, true);
};
