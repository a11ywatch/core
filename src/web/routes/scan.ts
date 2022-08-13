import { getUserFromApi } from "@app/core/utils";
import { scanWebsite, crawlPage } from "@app/core/actions";
import type { Request, Response } from "express";
import { paramParser } from "../params/extracter";
import { WEBSITE_URL_ERROR } from "@app/core/strings";
import { responseModel } from "@app/core/models";
import { StatusCode } from "../messages/message";

/*
 * SCAN -> PAGEMIND: Single page [does not store values to cdn]
 * Deducts API usage for the day
 **/
export const scanSimple = async (req: Request, res: Response) => {
  const baseUrl = paramParser(req, "websiteUrl") || paramParser(req, "url");
  const url = baseUrl ? decodeURIComponent(baseUrl) : "";

  if (!url) {
    res.status(400);
    res.json(
      responseModel({
        code: StatusCode.BadRequest,
        data: null,
        message: WEBSITE_URL_ERROR,
      })
    );
    return;
  }

  try {
    // returns truthy if can continue
    const userNext = await getUserFromApi(
      req?.headers?.authorization,
      req,
      res
    );

    if (userNext) {
      const pageInsights =
        paramParser(req, "pageInsights") || paramParser(req, "pageInsights");

      const userId = userNext?.id;

      let resData = {};

      if (typeof userId !== "undefined") {
        resData = await crawlPage(
          {
            url,
            userId,
            pageInsights,
          },
          false
        );
      } else {
        resData = await scanWebsite({
          url,
          noStore: true,
          pageInsights,
        });
      }

      res.json(resData);
    }
  } catch (e) {
    console.error(e);
  }
};
