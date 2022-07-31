import { getUserFromApiScan } from "@app/core/utils/get-user-data";
import { crawlMultiSiteWithEvent } from "@app/core/utils";
import { responseModel } from "@app/core/models";
import { paramParser } from "../extracter";

// perform a website crawl coming from express
export const crawlRest = async (req, res) => {
  try {
    const userNext = await getUserFromApiScan(
      req.headers.authorization,
      req,
      res
    );

    if (!!userNext) {
      const url = decodeURIComponent(
        paramParser(req, "websiteUrl") || paramParser(req, "url")
      );

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
