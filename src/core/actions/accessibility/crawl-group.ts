import { CRAWLER_FINISHED, WEBSITE_NOT_FOUND } from "../../../core/strings";
import { getHostName } from "../../../core/utils";
import { responseModel } from "../../../core/models";
import { crawlPage } from "./crawl";

/*  Crawl the website for issues gRPC from Pagemind.
 *  Gets all users actively trying to crawl pages and joins them together for the scan.
 *  @returns response model defaults {success: true}
 */
export const crawlWebsite = async (params, sendEmail?: boolean) => {
  const { userId: uid, user_id, url: urlMap, html } = params ?? {};
  const userId = uid ?? user_id;

  if (!html && !getHostName(urlMap)) {
    return responseModel({ message: WEBSITE_NOT_FOUND });
  }
  
  await crawlPage(
    { ...params, url: urlMap, userId: Number(userId) },
    sendEmail
  );

  return responseModel({ message: CRAWLER_FINISHED });
};
