import { withFilter } from "graphql-subscriptions";
import { WEBSITE_ADDED } from "../../../core/static";
import { pubsub } from "../../../database/pubsub";

export const websiteAdded = {
  subscribe: withFilter(
    () => pubsub.asyncIterator(WEBSITE_ADDED),
    (payload: any, variables: any, context: any) => {
      const id = payload.websiteAdded.userId;

      return id === context?.userId || id === variables?.userId;
    }
  ),
};
