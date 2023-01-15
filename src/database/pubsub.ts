import { RedisPubSub } from "graphql-redis-subscriptions";
import { createRedisClient, redisConnected } from "./memory-client";

let pubsub: Partial<RedisPubSub>;

// PUB/SUB GQL Redis client
async function createPubSub() {
  if (redisConnected) {
    pubsub = new RedisPubSub({
      publisher: createRedisClient(),
      subscriber: createRedisClient(),
    });
  } else {
    // todo: make optional
    const { PubSub } = await import("graphql-subscriptions");
    // use memory sub
    pubsub = new PubSub();
  }
}

export { pubsub, createPubSub };
