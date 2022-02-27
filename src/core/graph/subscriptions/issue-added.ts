import { withFilter } from "apollo-server";
import { ISSUE_ADDED } from "../../static";
import { pubsub } from "./pubsub";

export const issueAdded = {
  subscribe: withFilter(
    () => pubsub.asyncIterator(ISSUE_ADDED),
    (payload: any, variables: any, context: any) => {
      const id = payload.issueAdded.userId;

      return id === context?.userId || id === variables?.userId;
    }
  ),
};
