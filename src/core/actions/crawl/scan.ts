import { sourceBuild } from "@a11ywatch/website-source-builder";
import { ApiResponse, responseModel, makeWebsite } from "@app/core/models";
import { ResponseModel } from "@app/core/models/response/types";
import { getHostName } from "@app/core/utils";
import { fetchPageIssues } from "./fetch-issues";
import { extractPageData } from "./extract-page-data";
import { limitIssue } from "./limit-issue";
import type { PageMindScanResponse } from "@app/schema";

type ScanParams = {
  userId?: number;
  url: string;
  noStore?: boolean;
};

// Send to gRPC pagemind un-auth request
export const scanWebsite = async ({
  userId,
  url: urlMap,
  noStore,
}: ScanParams): Promise<ResponseModel> => {
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

  let dataSource: PageMindScanResponse;

  try {
    dataSource = await fetchPageIssues({
      pageHeaders: website.pageHeaders,
      url: pageUrl,
      userId,
      pageInsights: false,
      noStore,
    });
  } catch (e) {
    console.error(e);
  }

  if (!dataSource) {
    return responseModel();
  }

  if (!dataSource?.webPage) {
    return {
      website: null,
      code: 300,
      success: false,
      message:
        "Website timeout exceeded threshhold for scan, website rendered to slow under 15000 ms",
    };
  }

  return new Promise((resolve, reject) => {
    try {
      const { script, issues, webPage } = extractPageData(dataSource);

      const slicedIssue = limitIssue(issues);

      const data = Object.assign({}, website, webPage, {
        timestamp: new Date().getTime(),
        script,
        issue: slicedIssue,
      });

      if (data.issuesInfo) {
        data.issuesInfo.limitedCount = slicedIssue.length;
      }

      resolve(
        responseModel({
          website: data,
        })
      );
    } catch (e) {
      reject(e);
    }
  });
};
