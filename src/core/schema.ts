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
  invoice,
} from "./graph/gql_types";
import { getGqlRateLimitDirective } from "@app/web/limiters";
import gql from "graphql-tag";
import { applyMiddleware } from "graphql-middleware";

const typeDefs = gql`
  directive @rateLimit(
    max: Int
    window: String
    message: String
    identityArgs: [String]
    arrayLengthField: String
  ) on FIELD_DEFINITION

  ${invoice}
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

const createScheme = () => {
  const rateLimit = getGqlRateLimitDirective();

  const scheme = {
    typeDefs,
    resolvers,
    schemaDirectives: {
      rateLimit,
    },
  };

  return applyMiddleware(makeExecutableSchema(scheme as any));
};

export { createScheme, typeDefs };
