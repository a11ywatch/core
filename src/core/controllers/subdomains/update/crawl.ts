import { getHostName } from "@app/core/utils";
import { ApiResponse, responseModel } from "@app/core/models";
import { getActiveUsersCrawling } from "@app/core/utils/query";
import { crawlPage } from "./utils/crawl-page";

// TODO: MOVE TO RPC
export const crawlWebsite = async (params, sendEmail?: boolean) => {
  const { userId, url: urlMap, usersPooling } = params ?? {};

  if (!getHostName(urlMap)) {
    return responseModel({ msgType: ApiResponse.NotFound });
  }

  const usersPool =
    usersPooling ?? (await getActiveUsersCrawling({ userId, urlMap }));

  if (usersPool.length) {
    for (const id of usersPool) {
      await crawlPage({ ...params, userId: Number(id) }, sendEmail);
    }
  } else {
    await crawlPage(params, sendEmail);
  }

  return responseModel({ msgType: ApiResponse.Success });
};
