import { withFilter } from "apollo-server";
import { SUBDOMAIN_ADDED } from "../../static";
import { pubsub } from "./pubsub";

export const subDomainAdded = {
  subscribe: withFilter(
    () => pubsub.asyncIterator(SUBDOMAIN_ADDED),
    (payload: any, variables: any, context: any) => {
      const id = payload.subDomainAdded.userId;
      return id === context?.userId || id === variables?.userId;
    }
  ),
};
