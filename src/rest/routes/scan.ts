import { getUserFromApi, stripUrlEndingSlash } from "@app/core/utils";
import { scanWebsite, crawlPage } from "@app/core/actions";
import type { Request, Response } from "express";
import { initUrl } from "@a11ywatch/website-source-builder";

/*
 * SCAN -> PAGEMIND: Single page [does not store values to cdn]
 * Deducts API usage for the day
 **/
export const scanSimple = async (req: Request, res: Response) => {
  try {
    const uri = decodeURIComponent(req.body?.websiteUrl || req.body?.url);
    const url = stripUrlEndingSlash(initUrl(uri));

    // returns truthy if can continue
    const userNext = await getUserFromApi(req.headers.authorization, req, res);

    if (!!userNext) {
      const userId = userNext?.id;
      let data = {};

      if (typeof userId !== "undefined") {
        data = await crawlPage(
          {
            url,
            userId,
          },
          false
        );
      } else {
        data = await scanWebsite({
          url,
          noStore: true,
          userId,
        });
      }

      res.json(data);
    }
  } catch (e) {
    console.error(e);
  }
};
