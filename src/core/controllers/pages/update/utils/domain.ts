import { getAnalyticsPaging } from "../../../analytics";
import { arrayAverage } from "../../../../utils";

// default hard page limit
const PAGE_LIMIT = 10;

const defaultIssuesInfo = {
  warningCount: 0,
  errorCount: 0,
  noticeCount: 0,
  adaScoreAverage: 0,
  issuesFixedByCdn: 0,
  possibleIssuesFixedByCdn: 0,
};

// the score generated
type ScoreProps = {
  domain?: string;
  perfectScore?: boolean;
  userId?: number;
  all?: boolean; // subdomains and tld to get all pages
};

// standard issue type [TODO centralize]
type IssuesInfo = {
  adaScoreAverage: number;
  possibleIssuesFixedByCdn: any;
  totalIssues: any;
  issuesFixedByCdn: any;
  errorCount: any;
  warningCount: any;
  noticeCount: any;
  pageCount: number;
};

// main resolve handler
type Resolver = (
  value: { issuesInfo: IssuesInfo } | PromiseLike<{ issuesInfo: IssuesInfo }>
) => void;

const getDataUntil = async (
  baseProps: ScoreProps & { resolve: Resolver },
  offset?: number,
  prevIssuesInfo?: any
): Promise<void> => {
  const { domain, perfectScore, userId, all, resolve } = baseProps;
  const pages = await getAnalyticsPaging(
    {
      domain,
      userId,
      offset,
      all,
      limit: PAGE_LIMIT,
    },
    false
  );

  let websiteErrors = prevIssuesInfo?.errorCount ?? 0;
  let websiteWarnings = prevIssuesInfo?.warningCount ?? 0;
  let websiteNotices = prevIssuesInfo?.noticeCount ?? 0;
  let websiteIssuesFixedByCdn = prevIssuesInfo?.issuesFixedByCdn ?? 0;
  let websitePossibleIssuesFixedByCdn =
    prevIssuesInfo?.possibleIssuesFixedByCdn ?? 0;

  const adaScores: number[] = [];

  const pageCounter = pages?.length ?? 0;

  const pageCount = (prevIssuesInfo?.pageCount ?? 0) + pageCounter;

  for (const page of pages) {
    // collect website stats by iterating through pages.
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
        websitePossibleIssuesFixedByCdn + Number(possibleIssuesFixedByCdn);
    }
  }

  const averageItems = arrayAverage(adaScores);

  const avgScore = Math.round(
    isNaN(averageItems) || perfectScore ? 100 : averageItems
  );

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
    pageCount,
  };

  // recursively get the next page until scores are complete.
  if (pageCounter === PAGE_LIMIT) {
    await getDataUntil(baseProps, pageCount, issuesInfo);
  } else {
    resolve({ issuesInfo });
  }
};

// Recursive get the website score for total issues, warnings, and errors on page including average. @returns IssueInfo
export const generateWebsiteScore = async (
  props: ScoreProps
): Promise<{ issuesInfo: IssuesInfo }> => {
  return new Promise(async (resolve) => {
    await getDataUntil({ ...props, resolve });
  });
};
