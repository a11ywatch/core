import gql from "graphql-tag";

// SEND RAW JSON OBJECT FOR NOW
export const pageInsights = gql`
  type PageInsights {
    _id: ID
    userId: Int
    domain: String
    pageUrl: String
    json: String
  }
`;
