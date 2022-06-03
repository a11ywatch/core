import { getAnalyticsPaging } from "@app/core/controllers/analytics";
import { arrayAverage } from "@app/core/utils";

interface ScoreProps {
  domain?: string;
  perfectScore?: boolean;
  userId?: number;
}

const defaultIssuesInfo = {
  warningCount: 0,
  errorCount: 0,
  noticeCount: 0,
  adaScoreAverage: 0,
  issuesFixedByCdn: 0,
  possibleIssuesFixedByCdn: 0,
};

interface IssuesInfo {
  adaScoreAverage: number;
  possibleIssuesFixedByCdn: any;
  totalIssues: any;
  issuesFixedByCdn: any;
  errorCount: any;
  warningCount: any;
  noticeCount: any;
  pageCount: number;
}

export const getRecursiveResults = async ({
  domain,
  perfectScore,
  userId,
}: ScoreProps): Promise<{ issuesInfo: IssuesInfo }> => {
  return new Promise(async (resolve) => {
    const getDataUntil = async (
      { domain, perfectScore, userId }: ScoreProps,
      offset?: number,
      prevIssuesInfo?: any
    ): Promise<{ issuesInfo: IssuesInfo }> => {
      let pages = [];
      try {
        pages = await getAnalyticsPaging(
          {
            domain,
            userId,
            limit: 10,
            offset,
          },
          false
        );
      } catch (e) {
        console.error(e);
      }

      let websiteErrors = prevIssuesInfo?.errorCount ?? 0;
      let websiteWarnings = prevIssuesInfo?.warningCount ?? 0;
      let websiteNotices = prevIssuesInfo?.noticeCount ?? 0;
      let websiteIssuesFixedByCdn = prevIssuesInfo?.issuesFixedByCdn ?? 0;
      let websitePossibleIssuesFixedByCdn =
        prevIssuesInfo?.possibleIssuesFixedByCdn ?? 0;

      const adaScores: number[] = [];

      const pageCounter = pages?.length ?? 0;

      const pageCount = (prevIssuesInfo?.pageCount ?? 0) + pageCounter;

      if (pageCounter) {
        // collect website stats by iterating through pages.
        pages?.forEach((page) => {
          if (page) {
            const {
              warningCount,
              errorCount,
              noticeCount,
              adaScore,
              issuesFixedByCdn,
              possibleIssuesFixedByCdn,
            } = page ?? Object.assign({}, defaultIssuesInfo);

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
                websitePossibleIssuesFixedByCdn +
                Number(possibleIssuesFixedByCdn);
            }
          }
        });
      }

      let avgScore = prevIssuesInfo?.adaScoreAverage;

      if (pageCounter) {
        const averageItems = arrayAverage(adaScores);
        avgScore = Math.round(
          isNaN(averageItems) || perfectScore ? 100 : averageItems
        );
      }

      const issuesInfo = {
        adaScoreAverage: avgScore,
        possibleIssuesFixedByCdn: websitePossibleIssuesFixedByCdn,
        totalIssues: websiteErrors + websiteWarnings + websiteNotices,
        issuesFixedByCdn: websiteIssuesFixedByCdn,
        // issue counters
        errorCount: websiteErrors,
        warningCount: websiteWarnings,
        noticeCount: websiteNotices,
        // amount of pages with possible issues
        pageCount: pageCount,
      };

      // recursively get the next page until scores are complete.
      if (pageCounter) {
        await getDataUntil(
          { domain, perfectScore, userId },
          pageCount,
          issuesInfo
        );
      } else {
        resolve({ issuesInfo });
        return;
      }
    };

    await getDataUntil({ domain, perfectScore, userId });
  });
};

// Recursive get the website score for total issues, warnings, and errors on page including average. @returns IssueInfo
export const generateWebsiteScore = async (
  props: ScoreProps
): Promise<{ issuesInfo: IssuesInfo }> => {
  try {
    return await getRecursiveResults(props);
  } catch (e) {
    console.error(e);
  }
};
