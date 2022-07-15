import { jsonParse } from "@app/core/utils";
import Result from "@app/types/lhr";
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

  // pluck insight into its own collection
  const { insight, ...website } = webPage ?? {};

  if (website) {
    issuesInfo = website.issuesInfo;

    if (issuesInfo) {
      errorCount = issuesInfo.errorCount;
      warningCount = issuesInfo.warningCount;
      adaScore = issuesInfo.adaScore;
      noticeCount = issuesInfo.noticeCount;
    }

    // TODO: move Lighthouse into its own collection since it impacts search lookups
    if (insight) {
      let parsedInsight: Result;
      try {
        // extract data to valid JSON
        parsedInsight = jsonParse(insight as Struct) ?? undefined;
      } catch (e) {
        console.error(e);
      }

      if (parsedInsight) {
        try {
          const json = JSON.stringify(parsedInsight);

          if (parsedInsight) {
            lighthouseData = {
              userId,
              domain: website.domain,
              pageUrl: website.pageUrl || website.url,
              json,
            };
          }
        } catch (e) {
          console.error(e);
        }
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
    webPage: website,
    issuesInfo,
    lighthouseData,
  };
};
