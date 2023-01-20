import { removeTrailingSlash } from "@a11ywatch/website-source-builder";
import type { Struct } from "pb-util/build";
import type { PageMindScanResponse } from "../../../types/schema";
import { jsonParse } from "../../../core/utils";

// handle lighthouse extracting
export const extractLighthouse = ({ domain, pageUrl, userId, insight }) => {
  const parsedInsight: Record<string, unknown> = insight
    ? jsonParse(insight as Struct)
    : null;

  return {
    userId,
    domain,
    pageUrl: removeTrailingSlash(pageUrl),
    json: parsedInsight ? JSON.stringify(parsedInsight) : "",
  };
};

// type DataSource = {
//   userId?: number;
//   issues?: Issue;
//   webPage?: Website
// }
// generic page format
export const extractPageData = (dataSource: PageMindScanResponse) => {
  const { issues, webPage, userId } = dataSource ?? {
    // todo: rename top level collection
    issues: {
      issues: [],
    },
    webPage: null,
  };

  let errorCount;
  let warningCount;
  let noticeCount;
  let lighthouseData;

  // pluck insight into its own collection
  const { insight, ...w } = webPage ?? {};
  const { issuesInfo, ...website } = w ?? {};

  if (website && issuesInfo) {
    errorCount = issuesInfo.errorCount;
    warningCount = issuesInfo.warningCount;
    noticeCount = issuesInfo.noticeCount;
  }

  return {
    userId,
    // collections
    issues,
    webPage: website,
    issuesInfo,
    lighthouseData,
    // stats
    errorCount,
    warningCount,
    noticeCount,
  };
};
