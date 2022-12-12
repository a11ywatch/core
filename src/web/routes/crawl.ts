import { FastifyContext } from "apollo-server-fastify";
import { getUserFromApiScan } from "../../core/utils/get-user-data";
import { crawlMultiSiteWithEvent } from "../../core/utils";
import { responseModel } from "../../core/models";
import { paramParser } from "../params/extracter";
import { WEBSITE_URL_ERROR } from "../../core/strings";
import { StatusCode } from "../messages/message";

// perform a website crawl
export const crawlRest = async (
  req: FastifyContext["request"],
  res: FastifyContext["reply"]
) => {
  const baseUrl = paramParser(req, "websiteUrl") || paramParser(req, "url");
  const url = baseUrl ? decodeURIComponent(baseUrl) : "";
  const subdomains =
    paramParser(req, "subdomains") || paramParser(req, "subdomains");
  const tld = paramParser(req, "tld") || paramParser(req, "tld");

  if (!url) {
    res.status(StatusCode.BadRequest);
    res.send(
      responseModel({
        code: StatusCode.BadRequest,
        data: null,
        message: WEBSITE_URL_ERROR,
      })
    );
    return;
  }

  const userNext = await getUserFromApiScan(
    req?.headers?.authorization || req?.cookies?.jwt,
    req,
    res
  );

  if (userNext) {
    const { data, message } = await crawlMultiSiteWithEvent({
      url,
      userId: userNext.id,
      subdomains: !!userNext?.role && subdomains,
      tld: !!userNext?.role && tld,
    });

    res.send(
      responseModel({
        code: StatusCode.Ok,
        data,
        message,
      })
    );
  }
};
