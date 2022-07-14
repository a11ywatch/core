import { jsonParse } from "@app/core/utils";
import { Struct } from "pb-util/build";

export const extractPageData = (
  dataSource: any = { script: null, issues: null, webPage: null }
) => {
  let errorCount;
  let warningCount;
  let noticeCount;
  let adaScore;
  let issuesInfo;
  let lighthouseData;

  let { script, issues, webPage, userId } = dataSource;

  const { insight } = webPage ?? {};

  if (webPage) {
    issuesInfo = webPage.issuesInfo;
    if (issuesInfo) {
      errorCount = issuesInfo.errorCount;
      warningCount = issuesInfo.warningCount;
      adaScore = issuesInfo.adaScore;
      noticeCount = issuesInfo.noticeCount;
    }

    // TODO: move Lighthouse into its own collection since it impacts search lookups
    if (insight) {
      try {
        // extract data to valid JSON
        const parsedInsight = jsonParse(insight as Struct) ?? undefined;
        lighthouseData = {
          userId,
          domain: webPage.domain,
          pageUrl: webPage.pageUrl || webPage.url,
          json: JSON.stringify(parsedInsight),
        };
      } catch (e) {
        console.error(e);
      }
    }
  }

  return {
    userId,
    errorCount,
    warningCount,
    noticeCount,
    adaScore,
    script,
    issues,
    webPage,
    issuesInfo,
    lighthouseData,
  };
};
