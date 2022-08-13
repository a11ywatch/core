import { getUserFromApiScan } from "@app/core/utils/get-user-data";
import { crawlMultiSiteWithEvent } from "@app/core/utils";
import { responseModel } from "@app/core/models";
import { paramParser } from "../extracter";
import { WEBSITE_URL_ERROR } from "@app/core/strings";
import { StatusCode } from "../messages/message";

// perform a website crawl coming from express
export const crawlRest = async (req, res) => {
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
    const userNext = await getUserFromApiScan(
      req.headers.authorization,
      req,
      res
    );

    if (!!userNext) {
      const { data, message } = await crawlMultiSiteWithEvent({
        url,
        userId: userNext.id,
        scan: false,
        subdomains: userNext?.role >= 1,
        tld: userNext?.role >= 2,
      });

      res.json(
        responseModel({
          data,
          message,
        })
      );
    }
  } catch (e) {
    console.error(e);
  }
};
