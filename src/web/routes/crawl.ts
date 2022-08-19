import { getUserFromApiScan } from "@app/core/utils/get-user-data";
import { crawlMultiSiteWithEvent } from "@app/core/utils";
import { responseModel } from "@app/core/models";
import { paramParser } from "../params/extracter";
import { WEBSITE_URL_ERROR } from "@app/core/strings";
import { StatusCode } from "../messages/message";
import { FastifyContext } from "apollo-server-fastify";

// perform a website crawl coming from fastify
export const crawlRest = async (
  req: FastifyContext["request"],
  res: FastifyContext["reply"]
) => {
  const baseUrl = paramParser(req, "websiteUrl") || paramParser(req, "url");
  const url = baseUrl ? decodeURIComponent(baseUrl) : "";

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

  try {
    const userNext = await getUserFromApiScan(
      req.headers.authorization,
      req,
      res
    );

    if (userNext) {
      const { data, message } = await crawlMultiSiteWithEvent({
        url,
        userId: userNext.id,
        subdomains: userNext?.role >= 1,
        tld: userNext?.role >= 2,
      });

      res.send(
        responseModel({
          code: StatusCode.Ok,
          data,
          message,
        })
      );
    }
  } catch (e) {
    console.error(e);
  }
};
