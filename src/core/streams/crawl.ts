import { SUPER_MODE } from "@app/config/config";
import type { Request, Response } from "express";
import { getWebsite } from "../controllers/websites";
import { crawlHttpStream } from "../utils/crawl-stream";
import { getUserFromApiScan } from "../utils/get-user-data";

// Crawl stream with events.
export const crawlStreamLazy = async (req: Request, res: Response) => {
  try {
    const userNext = await getUserFromApiScan(
      req.headers.authorization,
      req,
      res
    );

    if (userNext) {
      const url = decodeURIComponent(req.body?.websiteUrl || req.body?.url);
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Transfer-Encoding": "chunked",
      });

      res.write("[");

      let subdomainsEnabled = req.body.subdomains;
      let tldEnabled = req.body.tld;

      if (!subdomainsEnabled || !tldEnabled) {
        try {
          const [website] = await getWebsite({ userId: userNext.id, url });
          if (website) {
            if (!subdomainsEnabled) {
              subdomainsEnabled = website.subdomains;
            }
            if (!tldEnabled) {
              tldEnabled = website.tld;
            }
          }
        } catch (e) {
          console.error(e);
        }
      }

      if (!SUPER_MODE) {
        subdomainsEnabled = subdomainsEnabled && userNext.role >= 1;
        tldEnabled = tldEnabled && userNext.role >= 2;
      }

      // TODO: pass in res and allow emitter of page when processed.
      await crawlHttpStream(
        {
          url,
          userId: userNext.id,
          scan: false,
          subdomains: subdomainsEnabled,
          tld: tldEnabled,
        },
        res
      );

      res.write("]");
      res.end();
    }
  } catch (e) {
    console.error(e);
  }
};
