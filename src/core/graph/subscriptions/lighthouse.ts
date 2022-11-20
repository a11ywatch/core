import { withFilter } from "graphql-subscriptions";
import { LIGHTHOUSE } from "../../static";
import { pubsub } from "../../../database/pubsub";

export const lighthouseResult = {
  subscribe: withFilter(
    () => pubsub.asyncIterator(LIGHTHOUSE),
    (payload: any, _: any, context: any) =>
      payload?.lighthouseResult?.userId === context?.userId
  ),
};
