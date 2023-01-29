import gql from "graphql-tag";

// todo: rename from pages to Page
export const page = gql`
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
    pageLoadTime: PageLoadTimeMeta
    issues(filter: String): [PageIssue]
    issuesInfo: IssueInfo
    pageInsights: Boolean
    insight: PageInsights
    actions: PageActions
  }
`;
