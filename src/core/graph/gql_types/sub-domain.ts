import gql from "graphql-tag";

export const subdomain = gql`
  type SubDomain {
    _id: ID
    url: String
    user: User
    domain: String
    userId: Int
    online: Boolean
    adaScore: Float
    cdnConnected: Boolean
    pageLoadTime: PageLoadTimeMeta
    issues(filter: String): [PageIssue]
    issuesInfo: IssueInfo
    pageInsights: Boolean
    insight: PageInsights
  }
`;
