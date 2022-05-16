import gql from "graphql-tag";

export const meta = gql`
  type IssueMeta {
    issuesFixedByCdn: Int
    possibleIssuesFixedByCdn: Int
    totalIssues: Int
    cdnConnected: Boolean
    skipContentIncluded: Boolean
    adaScoreAverage: Int
    adaScore: Int
    errorCount: Int
    warningCount: Int
    noticeCount: Int
    limitedCount: Int
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
