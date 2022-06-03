import { arrayAverage } from "@app/core/utils";
import { getDomains } from "../../find";

interface ScoreProps {
  domain?: string;
  perfectScore?: boolean;
  userId?: number;
  allDomains?: any[];
}

const defaultIssuesInfo = {
  warningCount: 0,
  errorCount: 0,
  noticeCount: 0,
  adaScoreAverage: 0,
  issuesFixedByCdn: 0,
  possibleIssuesFixedByCdn: 0,
};

// TODO: use Analytics collection and remove storing issue info in pages.
const getAllPages = async ({ domain, userId }: ScoreProps) => {
  try {
    return await getDomains({
      domain,
      userId,
    });
  } catch (e) {
    console.error(e);
    return [];
  }
};

// gets the website score for total issues, warnings, and errors on page including average. @returns IssueInfo
export const generateWebsiteScore = async ({
  domain,
  perfectScore,
  userId,
}: ScoreProps) => {
  let pages = [];
  try {
    // TODO: use paginated recursive call. USE analytics collection
    pages = await getAllPages({
      domain,
      userId,
    });
  } catch (e) {
    console.error(e);
  }

  let websiteErrors = 0;
  let websiteWarnings = 0;
  let websiteNotices = 0;
  let websiteIssuesFixedByCdn = 0;
  let websitePossibleIssuesFixedByCdn = 0;
  const adaScores: number[] = [];

  // collect website stats by iterating through pages.
  pages?.forEach((page) => {
    if (page) {
      const { issuesInfo } = page ?? {};
      const {
        warningCount,
        errorCount,
        noticeCount,
        adaScore,
        issuesFixedByCdn,
        possibleIssuesFixedByCdn,
      } = issuesInfo ?? Object.assign({}, defaultIssuesInfo);

      adaScores.push(Number(adaScore));

      if (errorCount) {
        websiteErrors = websiteErrors + Number(errorCount);
      }

      if (warningCount) {
        websiteWarnings = websiteWarnings + Number(warningCount);
      }

      if (noticeCount) {
        websiteNotices = websiteNotices + Number(noticeCount);
      }

      if (issuesFixedByCdn) {
        websiteIssuesFixedByCdn =
          websiteIssuesFixedByCdn + Number(issuesFixedByCdn);
      }

      if (possibleIssuesFixedByCdn) {
        websiteIssuesFixedByCdn =
          websitePossibleIssuesFixedByCdn + Number(possibleIssuesFixedByCdn);
      }
    }
  });

  const averageItems = arrayAverage(adaScores);
  const avgScore = isNaN(averageItems) || perfectScore ? 100 : averageItems;

  return {
    issueInfo: {
      adaScoreAverage: Math.round(avgScore),
      possibleIssuesFixedByCdn: websitePossibleIssuesFixedByCdn,
      totalIssues: websiteErrors + websiteWarnings + websiteNotices,
      issuesFixedByCdn: websiteIssuesFixedByCdn,
      // issue counters
      errorCount: websiteErrors,
      warningCount: websiteWarnings,
      noticeCount: websiteNotices,
      // amount of pages with possible issues
      pageCount: pages.length,
    },
  };
};
