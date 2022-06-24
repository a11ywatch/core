import type { Request, Response } from "express";
import { crawlHttpStream } from "../utils/crawl-stream";
import { getUserFromApiScan } from "../utils/get-user-data";

// perform a lazy stream to keep connection alive.
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

      // TODO: pass in res and allow emitter of page when processed.
      await crawlHttpStream(
        {
          url,
          userId: userNext.id,
          scan: false,
          subdomains: userNext?.role >= 1,
          tld: userNext?.role >= 2,
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
