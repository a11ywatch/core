import gql from "graphql-tag";

export const website = gql`
  type PageHeaders {
    key: String
    value: String
  }

  type Website {
    _id: ID
    url: String
    user: User
    userId: Int
    domain: String
    adaScoreAverage: Float
    cdnConnected: Boolean
    pageLoadTime: PageLoadTimeMeta
    analytics: [Analytic]
    issues(filter: String): [Issue]
    issue: [PageIssue]
    subDomains: [SubDomain]
    scripts: [Script]
    issuesInfo: IssueInfo
    script: Script
    lastScanDate: String
    documentTitle: String
    cdn: String
    pageHeaders: [PageHeaders]
    online: Boolean
    timestamp: String
    pageInsights: Boolean
    insight: PageInsights
    mobile: Boolean
    standard: String
    ua: String
    crawlDuration: Float
  }
`;
