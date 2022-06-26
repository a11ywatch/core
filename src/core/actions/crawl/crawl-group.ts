import { getHostName } from "@app/core/utils";
import { ApiResponse, responseModel } from "@app/core/models";
import { crawlPage } from "./crawl";

/*  Crawl the website for issues gRPC from Pagemind.
 *  Gets all users actively trying to crawl pages and joins them together for the scan.
 *  @returns response model defaults {success: true}
 */
export const crawlWebsite = async (params, sendEmail?: boolean) => {
  const { userId: uid, user_id, url: urlMap } = params ?? {};
  const userId = uid ?? user_id;

  if (!getHostName(urlMap)) {
    return responseModel({ msgType: ApiResponse.NotFound });
  }

  await crawlPage(
    { ...params, url: urlMap, userId: Number(userId) },
    sendEmail
  );

  return responseModel({ msgType: ApiResponse.Success });
};
