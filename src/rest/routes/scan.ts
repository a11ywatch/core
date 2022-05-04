import { getUserFromApi } from "@app/core/utils";
import { scanWebsite } from "@app/core/actions";
import type { Request, Response } from "express";

/*
 * SCAN -> PAGEMIND: Single page [does not store values to cdn]
 * Free for use since its relatively fast to handle.
 * Points deduction will come into play when cors is
 * only enabled for the main domain.
 **/
export const scanSimple = async (req: Request, res: Response) => {
  try {
    const url = req.body?.websiteUrl || req.body?.url;

    // returns truthy if can continue
    const userNext = await getUserFromApi(req.headers.authorization, req, res);

    if (!!userNext) {
      const data = await scanWebsite({
        url: decodeURI(url + ""),
        noStore: true,
        userId: userNext?.id,
      });

      res.json(data);
    }
  } catch (e) {
    console.error(e);
  }
};
