import { withFilter } from "graphql-subscriptions";
import { ISSUE_ADDED } from "../../static";
import { pubsub } from "../../../database/pubsub";

export const issueAdded = {
  subscribe: withFilter(
    () => pubsub.asyncIterator(ISSUE_ADDED),
    (payload: any, _: any, context: any) =>
      payload?.issueAdded?.userId === context?.userId
  ),
};
