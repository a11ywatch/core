import { ApolloServerExpressConfig } from "apollo-server-express";
import { BYPASS_AUTH } from "./config";
import { getUserFromToken } from "./core/utils";
import { createScheme } from "./core/schema";
import { AUTH_ERROR } from "./core/strings";

const getServerConfig = (
  extra?: ApolloServerExpressConfig
): ApolloServerExpressConfig => {
  const schema = createScheme();

  return {
    ...extra,
    introspection: true,
    schema,
    cache: "bounded",
    context: ({ req, res }) => {
      const authentication = req?.cookies?.jwt || req?.headers?.authorization;
      const user = getUserFromToken(authentication);

      // authentication error
      if (
        !user &&
        !BYPASS_AUTH.includes(req?.body?.operationName) &&
        req?.body?.operationName
      ) {
        throw new Error(AUTH_ERROR);
      }

      return {
        user,
        res,
      };
    },
  };
};

export { getServerConfig };
