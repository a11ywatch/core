import gql from "graphql-tag";

export const feature = gql`
  type Feature {
    id: ID
    feature: String
    enabled: Boolean
    user: [User]
    accountType: String
  }
`;
