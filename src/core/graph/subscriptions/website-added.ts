import { withFilter } from "apollo-server";
import { WEBSITE_ADDED } from "../../static";
import { pubsub } from "./pubsub";

export const websiteAdded = {
  subscribe: withFilter(
    () => pubsub.asyncIterator(WEBSITE_ADDED),
    (payload: any, variables: any, context: any) => {
      const id = payload.websiteAdded.userId;

      return id === context?.userId || id === variables?.userId;
    }
  ),
};
