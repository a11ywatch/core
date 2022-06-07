import gql from "graphql-tag";

export const history = gql`
  """
  Websites that have been added and removed.
  """
  type History {
    _id: ID
    url: String
    user: User
    issues(filter: String): [Issue]
    subDomains: [SubDomain]
    userId: Int
    domain: String
    cdnConnected: Boolean
    pageLoadTime: PageLoadTimeMeta
    issuesInfo: IssueMeta
    pageInsights: Boolean
    insight: PageInsights
  }
`;
