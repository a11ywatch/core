import { withFilter } from "graphql-subscriptions";
import { CRAWL_COMPLETE } from "../../static";
import { pubsub } from "../../../database/pubsub";

export const crawlComplete = {
  subscribe: withFilter(
    () => pubsub.asyncIterator(CRAWL_COMPLETE),
    (payload: any, _: any, context: any) =>
      payload?.crawlComplete?.userId === context?.userId
  ),
};
