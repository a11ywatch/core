import gql from "graphql-tag";

export const issue = gql`
  type PageIssue {
    code: String
    context: String
    message: String
    runner: String
    type: String
    selector: String
    typeCode: Int
    recurrence: Int
  }

  type Issue {
    _id: ID
    issues(filter: String): [PageIssue]
    domain: String
    pageUrl: String
  }
`;
