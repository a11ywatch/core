import type { ApolloServerFastifyConfig } from "apollo-server-fastify";
import { BYPASS_AUTH, SUPER_MODE } from "./config";
import { getUserFromToken } from "./core/utils";
import { createScheme } from "./core/schema";
import { AUTH_ERROR } from "./core/strings";

const getServerConfig = (
  extra?: ApolloServerFastifyConfig
): ApolloServerFastifyConfig => {
  const schema = createScheme();

  return {
    ...extra,
    introspection: SUPER_MODE,
    schema,
    cache: "bounded",
    csrfPrevention: true,
    context: (ctx) => {
      const req = ctx?.request;
      const authentication = (req?.headers as any)?.authorization || "";
      const body = req?.body as any;

      const user = getUserFromToken(authentication);

      const operation = body ? body?.operationName : "";

      // authentication error
      if (!user && operation && !BYPASS_AUTH.includes(operation)) {
        throw new Error(AUTH_ERROR);
      }

      return {
        user,
        res: ctx.reply, // pass the reply to gql
      };
    },
  };
};

export { getServerConfig };
