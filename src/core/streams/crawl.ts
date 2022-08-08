import type { NextFunction, Request, Response } from "express";
import { crawlHttpStream } from "../utils/crawl-stream";
import { crawlHttpStreamSlim } from "../utils/crawl-stream-slim";
import { getUserFromApiScan } from "../utils/get-user-data";
import { getCrawlConfig } from "./crawl-config";

// Crawl stream with events.
export const crawlStream = async (
  req: Request,
  res: Response,
  _next: NextFunction,
  slim: boolean = false
) => {
  const client = req.get("X-Request-Client");
  const userNext = await getUserFromApiScan(
    req?.headers?.authorization,
    req,
    res
  );

  if (userNext) {
    const url = decodeURIComponent(req.body?.websiteUrl || req.body?.url);
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Transfer-Encoding": "chunked",
    });

    const crawlProps = await getCrawlConfig({
      id: userNext.id,
      url,
      role: userNext.role,
      subdomains: req.body.subdomains,
      tld: req.body.tld,
    });

    res.write("[");

    if (slim) {
      await crawlHttpStreamSlim(crawlProps, res, client);
    } else {
      await crawlHttpStream(crawlProps, res, client);
    }

    res.write("]");
    res.end();
  }
};
