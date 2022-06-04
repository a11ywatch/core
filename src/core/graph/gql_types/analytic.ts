import gql from "graphql-tag";

export const analytic = gql`
  type Analytic {
    _id: ID
    domain: String
    pageUrl: String
    errorCount: Int
    warningCount: Int
    noticeCount: Int
    userId: Int
    adaScore: Float
    possibleIssuesFixedByCdn: Int
    totalIssues: Int
    issuesFixedByCdn: Int
  }
`;
