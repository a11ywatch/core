export const extractPageData = (
  dataSource: any = { script: null, issues: null, webPage: null }
) => {
  let errorCount;
  let warningCount;
  let noticeCount;
  let adaScore;
  let issuesInfo;
  let { script, issues, webPage, userId } = dataSource;

  if (webPage) {
    issuesInfo = webPage.issuesInfo;
    if (issuesInfo) {
      errorCount = issuesInfo.errorCount;
      warningCount = issuesInfo.warningCount;
      adaScore = issuesInfo.adaScore;
      noticeCount = issuesInfo.noticeCount;
    }
    if (webPage?.insight) {
      webPage.insight = {
        json: JSON.stringify(webPage?.insight),
      };
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
  };
};
