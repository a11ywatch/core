import { withFilter } from "graphql-subscriptions";
import { ISSUE_ADDED } from "../../../core/static";
import { pubsub } from "@app/database/pubsub";

export const issueAdded = {
  subscribe: withFilter(
    () => pubsub.asyncIterator(ISSUE_ADDED),
    (payload: any, variables: any, context: any) => {
      const id = payload.issueAdded.userId;

      return id === context?.userId || id === variables?.userId;
    }
  ),
};
