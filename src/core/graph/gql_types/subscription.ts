import gql from "graphql-tag";

export const subscription = gql`
  type Subscription {
    websiteAdded(userId: Int): Website
    issueAdded(userId: Int): Issue
    subDomainAdded(userId: Int): SubDomain
    emailVerified(userId: Int): User
    crawlComplete(userId: Int): Website
    issueRemoved: Issue
    subDomainRemoved: SubDomain
    websiteRemoved: Website
  }
`;
