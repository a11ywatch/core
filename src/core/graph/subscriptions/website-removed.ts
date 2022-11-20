import { withFilter } from "graphql-subscriptions";
import { WEBSITE_REMOVED } from "../../static";
import { pubsub } from "../../../database/pubsub";

export const websiteRemoved = {
  subscribe: withFilter(
    () => pubsub.asyncIterator(WEBSITE_REMOVED),
    (payload: any, _: any, context: any) =>
      payload?.websiteRemoved?.userId === context?.userId
  ),
};
