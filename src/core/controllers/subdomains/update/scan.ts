import { sourceBuild } from "@a11ywatch/website-source-builder";

import { ApiResponse, responseModel, makeWebsite } from "@app/core/models";
import { fetchPuppet, extractPageData, limitIssue } from "./utils";
import { ResponseModel } from "@app/core/models/response/types";
import { getHostName } from "@app/core/utils";
import { redisClient } from "@app/database/memory-client";

export const scanWebsite = async ({
  userId: userIdMap,
  url: urlMap,
}: any): Promise<ResponseModel> => {
  const userId = !userIdMap && userIdMap !== 0 ? -1 : userIdMap;

  if (!getHostName(urlMap)) {
    return responseModel({ msgType: ApiResponse.NotFound });
  }

  const { pageUrl, domain } = sourceBuild(urlMap, userId);

  if (
    process.env.NODE_ENV === "production" &&
    pageUrl.includes("http://localhost:")
  ) {
    throw new Error("Cannot use localhost, please use a valid web url.");
  }

  const website = makeWebsite({ url: pageUrl, domain });

  return await new Promise(async (resolve, reject) => {
    try {
      const dataSource = await fetchPuppet({
        pageHeaders: website?.pageHeaders,
        url: pageUrl,
        userId,
      });

      if (dataSource) {
        if (!dataSource?.webPage) {
          return resolve({
            website: null,
            code: 300,
            success: false,
            message:
              "Website timeout exceeded threshhold for scan, website rendered to slow under 15000 ms",
          });
        }
        const { script, issues, webPage } = extractPageData(dataSource);

        // TODO: simply use dataSource?.webPage
        const updateWebsiteProps = {
          ...website,
          ...webPage,
          timestamp: new Date().getTime(),
          script,
        };

        const slicedIssue = limitIssue(issues);

        if (updateWebsiteProps.issuesInfo) {
          updateWebsiteProps.issuesInfo.limitedCount = slicedIssue.length;
        }

        const websiteTarget = {
          issue: slicedIssue,
          ...updateWebsiteProps,
        };

        try {
          await redisClient.set(
            websiteTarget.url,
            JSON.stringify({
              ...updateWebsiteProps,
              issue: JSON.stringify(slicedIssue),
              script: undefined, // remove scripts from storage
            })
          );
          await redisClient.expire(websiteTarget.url, 60 * 5); // expire in 5 mins
        } catch (e) {
          console.error(e);
        }

        resolve(
          responseModel({
            website: websiteTarget,
          })
        );
      } else {
        resolve(responseModel());
      }
    } catch (e) {
      console.error(e);
      reject(e);
    }
  });
};
