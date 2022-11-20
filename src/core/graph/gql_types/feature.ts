import gql from "graphql-tag";

export const feature = gql`
  """
  Feature toggle. [Deprecated - not currently used]
  """
  type Feature {
    id: ID
    feature: String
    enabled: Boolean
    user: [User]
    accountType: String
  }
`;
