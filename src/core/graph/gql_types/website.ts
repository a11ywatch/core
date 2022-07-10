import gql from "graphql-tag";

export const website = gql`
  """
  Custom page header for network request.
  """
  type PageHeaders {
    key: String
    value: String
  }

  """
  Custom page actions to run before running test.
  """
  type PageActions {
    _id: ID
    path: String
    domain: String
    events: [String]
  }

  """
  A website to monitor and perform site wide scans.
  """
  type Website {
    _id: ID
    url: String
    user: User
    userId: Int
    domain: String
    adaScoreAverage: Float
    cdnConnected: Boolean
    pageLoadTime: PageLoadTimeMeta
    issuesInfo: IssueInfo
    script: Script
    lastScanDate: String
    documentTitle: String
    cdn: String
    online: Boolean
    timestamp: String
    pageInsights: Boolean
    insight: PageInsights
    mobile: Boolean
    standard: String
    ua: String
    actionsEnabled: Boolean
    robots: Boolean
    subdomains: Boolean
    tld: Boolean
    crawlDuration: Float
    issue: [PageIssue]
    analytics: [Analytic]
    scripts(
      limit: Int = 0
      offset: Int = 0
      offset: Int = 0
      all: Boolean = false
    ): [Script]
    pageHeaders: [PageHeaders]
    issues(
      filter: String
      limit: Int = 0
      offset: Int = 0
      all: Boolean = false
    ): [Issue]
    pages(limit: Int = 0, offset: Int = 0, offset: Int = 0): [Pages]
    actions(limit: Int = 0, offset: Int = 0): [PageActions]
  }
`;
