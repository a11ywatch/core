import { FastifyContext } from "apollo-server-fastify";
import { crawlStream } from "./crawl";

// Crawl stream with events slim data.
export const crawlStreamSlim = async (
  req: FastifyContext["request"],
  res: FastifyContext["reply"]
) => {
  await crawlStream(req, res, true);
};
