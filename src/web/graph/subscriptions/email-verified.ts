import { withFilter } from "graphql-subscriptions";
import { EMAIL_VERIFIED } from "../../../core/static";
import { pubsub } from "@app/database/pubsub";

export const emailVerified = {
  subscribe: withFilter(
    () => pubsub.asyncIterator(EMAIL_VERIFIED),
    (payload: any, variables: any, context: any) => {
      const id = payload.emailVerified.userId;

      return id === context?.userId || id === variables?.userId;
    }
  ),
};
