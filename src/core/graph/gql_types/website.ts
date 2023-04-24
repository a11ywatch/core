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
    pageLoadTime: PageLoadTimeMeta
    issuesInfo: IssueInfo
    lastScanDate: String
    documentTitle: String
    online: Boolean
    timestamp: String
    pageInsights: Boolean
    insight: PageInsights
    mobile: Boolean
    standard: String
    ua: String
    verified: Boolean
    verificationCode: String
    actionsEnabled: Boolean
    robots: Boolean
    subdomains: Boolean
    tld: Boolean
    crawlDuration: Float
    shutdown: Boolean
    issue: [PageIssue]
    pageHeaders: [PageHeaders]
    ignore: [String]
    rules: [String]
    runners: [String]
    proxy: String
    sitemap: Boolean
    monitoringEnabled: Boolean
    analytics(limit: Int = 0, offset: Int = 0, all: Boolean = false): [Analytic]
    issues(
      filter: String
      limit: Int = 0
      offset: Int = 0
      all: Boolean = false
    ): [Issue]
    pages(
      limit: Int = 0
      offset: Int = 0
      insights: Boolean = false
    ): [Pages]
    actions(limit: Int = 0, offset: Int = 0): [PageActions]
  }

  """
  A website crawl status.
  """
  type CrawlStatus {
    domain: String
    accessScoreAverage: Int
    shutdown: Boolean
  }
`;
