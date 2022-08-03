import { SUPER_MODE } from "@app/config/config";
import type { NextFunction, Request, Response } from "express";
import { getWebsite } from "../controllers/websites";
import { crawlHttpStream } from "../utils/crawl-stream";
import { crawlHttpStreamSlim } from "../utils/crawl-stream-slim";
import { getUserFromApiScan } from "../utils/get-user-data";

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

    let subdomainsEnabled = req.body.subdomains;
    let tldEnabled = req.body.tld;

    if (!subdomainsEnabled || !tldEnabled) {
      const [website] = await getWebsite({ userId: userNext.id, url });
      if (website) {
        if (!subdomainsEnabled) {
          subdomainsEnabled = website.subdomains;
        }
        if (!tldEnabled) {
          tldEnabled = website.tld;
        }
      }
    }

    if (!SUPER_MODE) {
      subdomainsEnabled = subdomainsEnabled && userNext?.role >= 1;
      tldEnabled = tldEnabled && userNext?.role >= 2;
    }

    const crawlProps = {
      url,
      userId: userNext?.id,
      subdomains: subdomainsEnabled,
      tld: tldEnabled,
    };

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
