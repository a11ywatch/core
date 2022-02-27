import {
  emailVerified,
  issueAdded,
  websiteAdded,
  pubsub,
  subDomainAdded,
  websiteRemoved,
} from "./graph/subscriptions";

const Subscription = {
  emailVerified,
  issueAdded,
  subDomainAdded,
  websiteAdded,
  websiteRemoved,
};

export { pubsub, Subscription };
