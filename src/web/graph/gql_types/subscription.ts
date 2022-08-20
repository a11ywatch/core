import gql from "graphql-tag";

export const subscription = gql`
  """
  Web-socket subscriptions.
  """
  type Subscription {
    websiteAdded(userId: Int): Website
    issueAdded(userId: Int): Issue
    emailVerified(userId: Int): User
    crawlComplete(userId: Int): CrawlStatus
    websiteRemoved: Website
  }
`;
