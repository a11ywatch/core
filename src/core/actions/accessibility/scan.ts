import { removeTrailingSlash } from "@a11ywatch/website-source-builder";
import { responseModel } from "../../models";
import { ResponseModel } from "../../models/response/types";
import { fetchPageIssues } from "./fetch-issues";
import { extractPageData } from "../../utils/shapes/extract-page-data";
import { limitIssue } from "../../utils/filters/limit-issue";
import { WEBSITE_NOT_FOUND } from "../../strings";
import { StatusCode } from "../../../web/messages/message";
import { SCAN_TIMEOUT } from "../../strings/errors";
import type { PageMindScanResponse } from "../../../types/schema";
import type { ScanRpcParams } from "../../../proto/actions/calls";

interface ScanParams extends Partial<ScanRpcParams> {
  userId?: number;
  url: string;
  noStore?: boolean; // prevent script storage
  pageInsights?: boolean; // lighthouse insights
};

/**
 * Send to gRPC pagemind request. Does not store any values into the DB from request. Full req -> res.
 *
 * Examples:
 *
 *     await scanWebsite({ url: "https://a11ywatch.com" });
 *     await scanWebsite({ url: "https://a11ywatch.com", noStore: true, mobile: true }); // prevent storing contents to CDN from pagemind
 *     await scanWebsite({ url: "https://a11ywatch.com", userId: 122, noStore: true, runners: ["axe", "htmlcs"] });
 */
export const scanWebsite = async ({
  userId,
  url,
  pageInsights = false,
  runners,
  mobile,
  standard,
  html,
  ua
}: ScanParams): Promise<ResponseModel> => {
  const pageUrl = removeTrailingSlash(url);

  if (!pageUrl) {
    return responseModel({ message: WEBSITE_NOT_FOUND });
  }

  const dataSource: PageMindScanResponse = await fetchPageIssues({
    url: pageUrl,
    userId,
    pageInsights,
    runners,
    mobile,
    standard,
    html,
    ua
  });

  // handled successful but, page did not exist or rendered to slow.
  if (!dataSource?.webPage) {
    return responseModel({
      data: null,
      code: StatusCode.BadRequest,
      success: false,
      message: SCAN_TIMEOUT,
    });
  }

  const { issues, webPage, issuesInfo } = extractPageData(dataSource);

  return responseModel({
    data: {
      domain: webPage.domain,
      url: webPage.url,
      pageLoadTime: webPage.pageLoadTime,
      timestamp: webPage.lastScanDate,
      issues: limitIssue(issues), // limited scan endpoint
      userId,
      issuesInfo,
    },
  });
};
