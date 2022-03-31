import { sourceBuild } from "@a11ywatch/website-source-builder";

import { ApiResponse, responseModel, makeWebsite } from "@app/core/models";
import { getWebsite } from "../../websites";
import { fetchPuppet, extractPageData, limitIssue } from "./utils";
import { createReport } from "../../reports";
import { ResponseModel } from "@app/core/models/response/types";
import { getHostName } from "@app/core/utils";

export const scanWebsite = async ({
  userId: userIdMap,
  url: urlMap,
}: any): Promise<ResponseModel> => {
  const userId = !userIdMap && userIdMap !== 0 ? -1 : userIdMap;

  if (!getHostName(urlMap)) {
    return responseModel({ msgType: ApiResponse.NotFound });
  }

  const { url, domain, pageUrl } = sourceBuild(urlMap, userId);

  if (
    process.env.NODE_ENV === "production" &&
    pageUrl.includes("http://localhost:")
  ) {
    throw new Error("Cannot use localhost, please use a valid web url.");
  }

  let [website] = await getWebsite({
    domain,
    userId,
  });

  if (!website) {
    website = makeWebsite({ url, domain });
  }

  return await new Promise(async (resolve, reject) => {
    try {
      const dataSource = await fetchPuppet({
        pageHeaders: website?.pageHeaders,
        url: urlMap,
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
        const { script, issues, webPage, pageHasCdn } =
          extractPageData(dataSource);

        // TODO: simply use dataSource?.webPage
        const updateWebsiteProps = {
          ...dataSource?.webPage,
          ...website,
          ...webPage,
          html: dataSource?.webPage?.html ?? "",
          cdnConnected: pageHasCdn,
          timestamp: new Date().getTime(),
          script,
        };

        const slicedIssue = limitIssue(issues);

        if (updateWebsiteProps.issuesInfo) {
          updateWebsiteProps.issuesInfo.limitedCount = slicedIssue.length;
        }

        await createReport(updateWebsiteProps, slicedIssue ?? issues);

        resolve(
          responseModel({
            website: {
              ...website,
              issue: slicedIssue,
              ...updateWebsiteProps,
            },
          })
        );
      } else {
        resolve(responseModel());
      }
    } catch (e) {
      console.log(e);
      reject(e);
    }
  });
};
