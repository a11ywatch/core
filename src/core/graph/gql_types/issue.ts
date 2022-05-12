import gql from "graphql-tag";

export const issue = gql`
  type Issue {
    code: String
    type: String
    typeCode: Int
    message: String
    context: String
    selector: String
    runner: String
    documentTitle: String
    issue: Issue
    issues(filter: String): [Issue]
    domain: String
    pageUrl: String
  }
`;
