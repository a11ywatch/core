import gql from "graphql-tag";

export const subdomain = gql`
  """
  Pages that have issues.
  """
  type Pages {
    _id: ID
    url: String
    user: User
    domain: String
    userId: Int
    online: Boolean
    cdnConnected: Boolean
    pageLoadTime: PageLoadTimeMeta
    issues(filter: String): [PageIssue]
    issuesInfo: IssueInfo
    pageInsights: Boolean
    insight: PageInsights
    actions: PageActions
  }
`;
