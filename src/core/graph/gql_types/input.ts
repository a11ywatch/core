import gql from "graphql-tag";

export const input = gql`
  input CreatePageHeaders {
    key: String!
    value: String!
  }

  input ScriptMetaInput {
    skipContentEnabled: Boolean
    translateEnabled: Boolean
  }

  input PageActionsInput {
    path: String
    events: [String]
  }
`;
