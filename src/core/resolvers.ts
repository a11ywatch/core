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

export const resolvers = {
  Query,
  Mutation,
  Script,
  Subscription,
  User,
  Analytic,
  Website,
  Issue,
  Feature,
  SubDomain,
  History,
};
