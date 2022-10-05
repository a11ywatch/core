import type { FastifyContext } from "apollo-server-fastify";
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

  if (!url) {
    res.status(StatusCode.BadRequest);
    res.send([]);
    return;
  }

  const client = (req.headers["X-Request-Client"] ||
    req.headers["x-request-client"]) as string;

  const userNext = await getUserFromApiScan(
    req?.headers?.authorization,
    req,
    res
  );

  if (userNext) {
    res.raw.writeHead(StatusCode.Ok, {
      "Content-Type": "application/json",
      "Transfer-Encoding": "chunked",
    });

    const crawlProps = await getCrawlConfig({
      id: userNext.id,
      url,
      role: userNext.role,
      subdomains: body.subdomains,
      tld: body.tld,
      robots: body.robots,
    });

    res.raw.write("[");

    if (slim) {
      await crawlHttpStreamSlim(crawlProps, res, client);
    } else {
      await crawlHttpStream(crawlProps, res, client);
    }

    res.raw.write("]");

    // make sure request ends after completion callback
    setImmediate(() => {
      res.raw.end();
    });
  }
};
