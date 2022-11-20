import type { Struct } from "pb-util/build";
import { jsonParse } from "../../../core/utils";

// handle lighthouse extracting
export const extractLighthouse = ({ domain, pageUrl, userId, insight }) => {
    const parsedInsight: Record<string, unknown> = insight ? jsonParse(
      insight as Struct
    ) : null;

    return {
      userId,
      domain,
      pageUrl,
      json: parsedInsight ? JSON.stringify(parsedInsight) : "",
  };
}

export const extractPageData = (
  dataSource: any = { script: null, issues: null, webPage: null }
) => {
  let errorCount;
  let warningCount;
  let noticeCount;
  let adaScore;
  let lighthouseData;

  let { script, issues, webPage, userId } = dataSource;

  // pluck insight into its own collection
  const { insight, ...w } = webPage ?? {};
  const { issuesInfo, ...website } = w;

  if (website) {
    if (issuesInfo) {
      errorCount = issuesInfo.errorCount;
      warningCount = issuesInfo.warningCount;
      adaScore = issuesInfo.adaScore;
      noticeCount = issuesInfo.noticeCount;
    }

    if (insight) {
      lighthouseData = extractLighthouse({
        userId,
        domain: website.domain,
        pageUrl: website.pageUrl || website.url,
        insight, // TODO: prevent having to stringify
      });
    }
  }

  return {
    userId,
    // collections
    script,
    issues,
    webPage: website,
    issuesInfo,
    lighthouseData,
    // stats
    errorCount,
    warningCount,
    noticeCount,
    adaScore,
  };
};
