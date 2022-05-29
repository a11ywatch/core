import gql from "graphql-tag";

export const meta = gql`
  type IssueMeta {
    skipContentIncluded: Boolean
  }

  type IssueInfo {
    issuesFixedByCdn: Int
    possibleIssuesFixedByCdn: Int
    totalIssues: Int
    cdnConnected: Boolean
    issueMeta: IssueMeta
    adaScoreAverage: Int
    adaScore: Int
    errorCount: Int
    warningCount: Int
    noticeCount: Int
    limitedCount: Int
    pageCount: Int
  }

  type PageLoadTimeMeta {
    duration: Int
    durationFormated: String
    color: String
  }

  type ScriptMeta {
    skipContentEnabled: Boolean
    translateEnabled: Boolean
  }
`;
