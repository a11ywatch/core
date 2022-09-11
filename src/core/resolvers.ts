import { Query } from "./queries";
import { Mutation } from "./mutations";
import { Subscription } from "./subscriptions";
import { User, History, Website, Issue, Pages, Analytic, Script } from "./data";

// graphQL resolvers
export const resolvers = {
  Query,
  Mutation,
  Subscription,
  Script,
  User,
  Analytic,
  Website,
  Issue,
  Pages,
  History,
};
