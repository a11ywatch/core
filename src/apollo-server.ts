import { ApolloServerExpressConfig } from "apollo-server-express";
import { config, BYPASS_AUTH } from "./config";
import { getUserFromToken, parseCookie } from "./core/utils";
import { createScheme } from "./core/schema";
import { AUTH_ERROR } from "./core/strings";
import { SubDomainController } from "./core/controllers/subdomains";
import { ScriptsController } from "./core/controllers/scripts";
import { HistoryController } from "./core/controllers/history";
import { WebsitesController } from "./core/controllers/websites";
import { UsersController } from "./core/controllers/users";
import { IssuesController } from "./core/controllers/issues";
import { FeaturesController } from "./core/controllers/features";
import { AnalyticsController } from "./core/controllers/analytics";
import { ApolloServerPluginUsageReportingDisabled } from "apollo-server-core";

const { DEV } = config;

const getServerConfig = (): ApolloServerExpressConfig => {
  const schema = createScheme();
  return {
    schema,
    subscriptions: {
      onConnect: (_cnxnParams, webSocket, _cnxnContext) => {
        // @ts-ignore
        const cookie = webSocket?.upgradeReq?.headers?.cookie;
        const parsedCookie = parseCookie(cookie);
        const user = getUserFromToken(parsedCookie?.jwt || "");

        return {
          userId: user?.payload?.keyid,
        };
      },
    },
    context: ({ req, res, connection }) => {
      if (connection) {
        return connection.context;
      }
      const authentication = req?.cookies?.jwt || req?.headers?.authorization;
      const user = getUserFromToken(authentication);

      if (
        process.env.NODE_ENV !== "test" &&
        !user &&
        !BYPASS_AUTH.includes(req?.body?.operationName)
      ) {
        if (DEV && !req?.body?.operationName) {
          console.log("Generating Graphql Schema");
        } else {
          throw new Error(AUTH_ERROR);
        }
      }

      return {
        user,
        res,
        models: {
          User: UsersController({ user }),
          Website: WebsitesController({ user }),
          Issue: IssuesController({ user }),
          Features: FeaturesController({ user }),
          SubDomain: SubDomainController({ user }),
          History: HistoryController({ user }),
          Analytics: AnalyticsController({ user }),
          Scripts: ScriptsController({ user }),
        },
      };
    },
    plugins: [ApolloServerPluginUsageReportingDisabled()],
  };
};

export { getServerConfig };
