import { getUserFromApi } from "../../core/utils";
import { scanWebsite, crawlPage } from "../../core/actions";
import { paramParser, validateUID } from "../params/extracter";
import { WEBSITE_URL_ERROR } from "../../core/strings";
import { responseModel } from "../../core/models";
import { StatusCode } from "../messages/message";
import type { FastifyContext } from "apollo-server-fastify";

/*
 * SCAN -> PAGEMIND: Single page [does not store values to cdn]
 * Deducts API usage for the day
 **/
export const scanSimple = async (
  req: FastifyContext["request"],
  res: FastifyContext["reply"]
) => {
  const baseUrl = paramParser(req, "websiteUrl") || paramParser(req, "url");
  const url = baseUrl ? decodeURIComponent(baseUrl) : "";

  if (!url) {
    res.status(400);
    res.send(
      responseModel({
        code: StatusCode.BadRequest,
        data: null,
        message: WEBSITE_URL_ERROR,
      })
    );
    return;
  }

  // returns truthy if can continue
  const userNext = await getUserFromApi(req?.headers?.authorization, req, res);
  const userId = userNext?.id;
  const pageInsights =
    paramParser(req, "pageInsights") || paramParser(req, "pageInsights");

  let resData = {};

  if (validateUID(userId)) {
    resData = await crawlPage(
      {
        url,
        userId,
        pageInsights,
        sendSub: false,
      },
      false
    );
  } else {
    resData = await scanWebsite({
      url,
      noStore: !userNext?.role,
      pageInsights,
    });
  }

  res.send(resData);
};
