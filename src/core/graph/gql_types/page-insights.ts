import gql from "graphql-tag";

// SEND RAW JSON OBJECT FOR NOW
export const pageInsights = gql`
  type PageInsights {
    json: String
  }
`;
