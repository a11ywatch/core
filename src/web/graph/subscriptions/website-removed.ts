import { withFilter } from "graphql-subscriptions";
import { WEBSITE_REMOVED } from "../../../core/static";
import { pubsub } from "../../../database/pubsub";

export const websiteRemoved = {
  subscribe: withFilter(
    () => pubsub.asyncIterator(WEBSITE_REMOVED),
    (payload: any, variables: any, context: any) => {
      const id = payload.websiteRemoved.userId;

      return id === context?.userId || id === variables?.userId;
    }
  ),
};