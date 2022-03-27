import validUrl from "valid-url";
import { ApiResponse, responseModel } from "@app/core/models";
import { crawlPage } from "./utils/crawl-page";
import { getActiveUsersCrawling } from "@app/core/utils/query";

export const crawlWebsite = async (params, sendEmail?: boolean) => {
  const { userId, url: urlMap, usersPooling } = params ?? {};

  if (!validUrl.isUri(urlMap)) {
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
