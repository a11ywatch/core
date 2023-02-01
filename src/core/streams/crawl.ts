import type { FastifyContext } from "apollo-server-fastify";
import { validateUID } from "../../web/params/extracter";
import { crawlingSet, getKey } from "../../event/crawl-tracking";
import { StatusCode } from "../../web/messages/message";
import { crawlHttpStream } from "../utils/crawl-stream";
import { crawlHttpStreamSlim } from "../utils/crawl-stream-slim";
import { getUserFromApiScan } from "../utils/get-user-data";
import { getCrawlConfig } from "./crawl-config";

// Crawl stream with events.
// returns an array of reports for performance
export const crawlStream = async (
  req: FastifyContext["request"],
  res: FastifyContext["reply"],
  slim?: boolean
) => {
  const body = req.body as any;
  const baseUrl = body?.websiteUrl || body?.url;
  const url = baseUrl && decodeURIComponent(baseUrl);
  const removeTrailing = body.removeTrailing;

  if (!url) {
    res.status(StatusCode.BadRequest);
    return res.send([]);
  }

  const userNext = await getUserFromApiScan(
    req?.headers?.authorization || req?.cookies?.jwt,
    req,
    res
  );

  if (userNext) {
    const uid = userNext?.id;
    // block active crawl
    if (validateUID(uid) && crawlingSet.has(getKey(url, [], uid))) {
      res.status(StatusCode.Accepted);
      return res.send([]);
    }

    if (crawlingSet.has(getKey(url, [], uid))) {
      res.status(StatusCode.ToManyRequest);
      return res.send([]);
    }

    res.raw.writeHead(StatusCode.Ok, {
      "Content-Type": "application/json",
      "Transfer-Encoding": "chunked",
      "Access-Control-Allow-Origin": "*",
    });

    const crawlProps = await getCrawlConfig({
      id: userNext?.id,
      url,
      role: userNext?.role,
      subdomains: body.subdomains,
      tld: body.tld,
      robots: body.robots,
      sitemap: body.sitemap,
    });

    res.raw.write("[");

    if (slim) {
      await crawlHttpStreamSlim(crawlProps, res, removeTrailing);
    } else {
      await crawlHttpStream(crawlProps, res, removeTrailing);
    }

    res.raw.write("]");

    // make sure request ends after completion callback
    setImmediate(() => {
      res.raw.end();
    });
  }
};
