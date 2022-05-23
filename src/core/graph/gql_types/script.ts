import gql from "graphql-tag";

export const script = gql`
  type Script {
    id: ID
    pageUrl: String
    domain: String
    script: String
    cdnUrl: String
    cdnUrlMinified: String
    googleTranslateInclude: Boolean
    cdnConnected: Boolean
    issueMeta: IssueMeta
    scriptMeta: ScriptMeta
  }
`;
