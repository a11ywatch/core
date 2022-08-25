import { removeTrailingSlash } from "@a11ywatch/website-source-builder";
import { responseModel, makeWebsite } from "../../models";
import { ResponseModel } from "../../models/response/types";
import { getHostName } from "../../utils";
import { fetchPageIssues } from "./fetch-issues";
import { extractPageData } from "../../utils/shapes/extract-page-data";
import { limitIssue } from "../../utils/filters/limit-issue";
import { DISABLE_STORE_SCRIPTS, SUPER_MODE } from "../../../config/config";
import { WEBSITE_NOT_FOUND } from "../../strings";
import { StatusCode } from "../../../web/messages/message";
import { SCAN_TIMEOUT } from "../../strings/errors";
import { validateUID } from "../../../web/params/extracter";
import type { PageMindScanResponse } from "../../../types/schema";

type ScanParams = {
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
 *     await scanWebsite({ url: "https://a11ywatch.com", noStore: true }); // prevent storing contents to CDN from pagemind
 *     await scanWebsite({ url: "https://a11ywatch.com", userId: 122, noStore: true });
 */
export const scanWebsite = async ({
  userId,
  url,
  noStore = DISABLE_STORE_SCRIPTS,
  pageInsights = false,
}: ScanParams): Promise<ResponseModel> => {
  const pageUrl = removeTrailingSlash(url);
  const domain = getHostName(pageUrl);

  if (!domain) {
    return responseModel({ message: WEBSITE_NOT_FOUND });
  }

  if (
    process.env.NODE_ENV === "production" &&
    pageUrl.includes("http://localhost:")
  ) {
    throw new Error("Cannot use localhost, please use a valid web url.");
  }

  const website = makeWebsite({ url: pageUrl, domain });

  const dataSource: PageMindScanResponse = await fetchPageIssues({
    pageHeaders: website.pageHeaders,
    url: pageUrl,
    userId,
    pageInsights,
    noStore: !SUPER_MODE ? true : noStore,
    scriptsEnabled: false,
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

  const userFound = validateUID(userId);
  const { script, issues, webPage } = extractPageData(dataSource);

  // Issues.issues returned. Map against
  let currentIssues = issues?.issues;
  let limitedCount = false;

  if (userFound) {
    website.userId = userId;
  }

  if (!SUPER_MODE && !userFound) {
    currentIssues = limitIssue(issues);
    limitedCount = true;
  }

  const data = Object.assign({}, website, webPage, {
    timestamp: new Date().getTime(),
    script,
    issues: currentIssues,
  });

  // return limited count from scan
  if (limitedCount) {
    data.issuesInfo.limitedCount = currentIssues.length;
  }

  return responseModel({
    data,
  });
};
