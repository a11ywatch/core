import gql from "graphql-tag";

export const subscription = gql`
  """
  Web-socket subscriptions.
  """
  type Subscription {
    websiteAdded: Website
    issueAdded: Website
    emailVerified: User
    crawlComplete: CrawlStatus
    websiteRemoved: Website
    lighthouseResult: Pages
  }
`;
