import { withFilter } from "graphql-subscriptions";
import { LIGHTHOUSE } from "../../static";
import { pubsub } from "../../../database/pubsub";

export const lightHouseResult = {
  subscribe: withFilter(
    () => pubsub.asyncIterator(LIGHTHOUSE),
    (payload: any, _: any, context: any) =>
      payload?.lightHouseResult?.userId === context?.userId
  ),
};
