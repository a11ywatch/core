import { Query } from "./queries";
import { Mutation } from "./mutations";
import { Subscription } from "./subscriptions";
import {
  User,
  History,
  Website,
  Issue,
  Feature,
  SubDomain,
  Analytic,
  Script,
} from "./data";

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
  Feature,
  SubDomain,
  History,
};
