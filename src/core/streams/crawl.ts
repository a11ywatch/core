import type { NextFunction, Request, Response } from "express";

import { crawlHttpStream } from "../utils/crawl-stream";
import { crawlHttpStreamSlim } from "../utils/crawl-stream-slim";
import { getUserFromApiScan } from "../utils/get-user-data";
import { getCrawlConfig } from "./crawl-config";

// Crawl stream with events.
// returns an array of reports for performance
export const crawlStream = async (
  req: Request,
  res: Response,
  _next: NextFunction,
  slim: boolean = false
) => {
  const baseUrl = req.body?.websiteUrl || req.body?.url;
  const url = baseUrl && decodeURIComponent(baseUrl);

  if (!url) {
    res.status(400);
    res.json([]);
    return;
  }

  const client = req.get("X-Request-Client");
  const userNext = await getUserFromApiScan(
    req?.headers?.authorization,
    req,
    res
  );

  if (userNext) {
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
