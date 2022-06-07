import gql from "graphql-tag";

export const script = gql`
  """
  Scripts that can fix issues and more.
  """
  type Script {
    _id: ID
    pageUrl: String
    domain: String
    script: String
    cdnUrl: String
    cdnUrlMinified: String
    cdnConnected: Boolean
    issueMeta: IssueMeta
    scriptMeta: ScriptMeta
  }
`;
