import gql from "graphql-tag";

export const query = gql`
  type Query {
    features: [Feature]
    websites(filter: String): [Website]
    website(url: String): Website
    subDomains(filter: String): [SubDomain]
    issues(filter: String): [Issue]
    history(filter: String): [History]
    analytics(filter: String): [Analytic]
    scripts(filter: String): [Script]
    script(filter: String, url: String): Script
    issue(url: String): Issue
    user: User
  }
`;
