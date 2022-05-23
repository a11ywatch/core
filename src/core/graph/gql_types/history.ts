import gql from "graphql-tag";

export const history = gql`
  type History {
    id: ID
    url: String
    user: User
    issues(filter: String): [Issue]
    subDomains: [SubDomain]
    userId: Int
    domain: String
    adaScore: Float
    cdnConnected: Boolean
    pageLoadTime: PageLoadTimeMeta
    issuesInfo: IssueMeta
    pageInsights: Boolean
    insight: PageInsights
  }
`;
