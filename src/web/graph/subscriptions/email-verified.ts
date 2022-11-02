import { withFilter } from "graphql-subscriptions";
import { EMAIL_VERIFIED } from "../../../core/static";
import { pubsub } from "../../../database/pubsub";

export const emailVerified = {
  subscribe: withFilter(
    () => pubsub.asyncIterator(EMAIL_VERIFIED),
    (payload: any, _: any, context: any) =>
      payload?.emailVerified?.userId === context?.userId
  ),
};
