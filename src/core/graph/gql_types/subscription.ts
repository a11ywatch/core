import gql from "graphql-tag";

export const subscription = gql`
  """
  Web-socket subscriptions.
  """
  type Subscription {
    websiteAdded: Website
    issueAdded: Issue
    emailVerified: User
    crawlComplete: CrawlStatus
    websiteRemoved: Website
    lightHouseResult: Pages
  }
`;
