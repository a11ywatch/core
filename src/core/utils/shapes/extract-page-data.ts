import type { Struct } from "pb-util/build";
import { jsonParse } from "../../../core/utils";

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
      const parsedInsight: Record<string, unknown> = jsonParse(
        insight as Struct
      );

      if (parsedInsight) {
        try {
          lighthouseData = {
            userId,
            domain: website.domain,
            pageUrl: website.pageUrl || website.url,
            json: JSON.stringify(parsedInsight), // TODO: prevent having to stringify
          };
        } catch (e) {
          console.error(e);
        }
      }
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
