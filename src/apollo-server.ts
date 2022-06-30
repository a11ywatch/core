import { ApolloServerExpressConfig } from "apollo-server-express";
import { BYPASS_AUTH } from "./config";
import { getUserFromToken } from "./core/utils";
import { createScheme } from "./core/schema";
import { AUTH_ERROR } from "./core/strings";
import { PagesController } from "./core/controllers/pages";
import { ScriptsController } from "./core/controllers/scripts";
import { HistoryController } from "./core/controllers/history";
import { WebsitesController } from "./core/controllers/websites";
import { UsersController } from "./core/controllers/users";
import { IssuesController } from "./core/controllers/issues";
import { FeaturesController } from "./core/controllers/features";
import { AnalyticsController } from "./core/controllers/analytics";
// import { ApolloServerPluginUsageReportingDisabled } from "apollo-server-core";

const getServerConfig = (
  extra?: ApolloServerExpressConfig
): ApolloServerExpressConfig => {
  const schema = createScheme();

  return {
    ...extra,
    introspection: true,
    schema,
    cache: "bounded",
    // plugins: [ApolloServerPluginUsageReportingDisabled()],
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
        models: {
          User: UsersController({ user }),
          Website: WebsitesController({ user }),
          Issue: IssuesController({ user }),
          Features: FeaturesController({ user }),
          Pages: PagesController({ user }),
          History: HistoryController({ user }),
          Analytics: AnalyticsController({ user }),
          Scripts: ScriptsController({ user }),
        },
      };
    },
  };
};

export { getServerConfig };
