import { makeExecutableSchema } from "@graphql-tools/schema";
import { resolvers } from "./resolvers";
import {
  user,
  pageInsights,
  feature,
  website,
  issue,
  subdomain,
  query,
  mutation,
  subscription,
  history,
  analytic,
  script,
  payments,
  meta,
  input,
} from "./graph/gql_types";

const typeDefs = `
  ${pageInsights}
  ${meta}
  ${payments}
  ${user}
  ${feature}
  ${website}
  ${subdomain}
  ${issue}
  ${script}
  ${analytic}
  ${history}
  ${query}
  ${input}
  ${mutation}
  ${subscription}
`;

const scheme = {
  typeDefs,
  resolvers,
};

export const schema = makeExecutableSchema(scheme as any);
