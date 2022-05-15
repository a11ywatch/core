import gql from "graphql-tag";

export const subdomain = gql`
  type SubDomain {
    id: ID
    url: String
    user: User
    domain: String
    userId: Int
    adaScore: Float
    cdnConnected: Boolean
    pageLoadTime: PageLoadTimeMeta
    issues(filter: String): [PageIssue]
    issuesInfo: IssueMeta
    pageInsights: Boolean
    insight: PageInsights
  }
`;
