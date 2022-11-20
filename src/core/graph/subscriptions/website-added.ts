import { withFilter } from "graphql-subscriptions";
import { WEBSITE_ADDED } from "../../static";
import { pubsub } from "../../../database/pubsub";

export const websiteAdded = {
  subscribe: withFilter(
    () => pubsub.asyncIterator(WEBSITE_ADDED),
    (payload: any, _: any, context: any) =>
      payload?.websiteAdded?.userId === context?.userId
  ),
};
