import { withFilter } from "graphql-subscriptions";
import { CRAWL_COMPLETE } from "../../../core/static";
import { pubsub } from "@app/database/pubsub";

export const crawlComplete = {
  subscribe: withFilter(
    () => pubsub.asyncIterator(CRAWL_COMPLETE),
    (payload: any, variables: any, context: any) => {
      const id = payload.crawlComplete.userId;

      return id === context?.userId || id === variables?.userId;
    }
  ),
};
