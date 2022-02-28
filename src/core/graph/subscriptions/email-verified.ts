import { withFilter } from "graphql-subscriptions";
import { EMAIL_VERIFIED } from "../../static";
import { pubsub } from "./pubsub";

export const emailVerified = {
  subscribe: withFilter(
    () => pubsub.asyncIterator(EMAIL_VERIFIED),
    (payload: any, variables: any, context: any) => {
      const id = payload.emailVerified.userId;

      return id === context?.userId || id === variables?.userId;
    }
  ),
};
