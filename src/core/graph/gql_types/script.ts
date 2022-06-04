import gql from "graphql-tag";

export const script = gql`
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
