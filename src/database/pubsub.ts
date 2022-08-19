import { RedisPubSub } from "graphql-redis-subscriptions";
import { createRedisClient } from "./memory-client";

let pubsub: RedisPubSub;

// PUB/SUB GQL Redis client
function createPubSub() {
  try {
    pubsub = new RedisPubSub({
      publisher: createRedisClient(),
      subscriber: createRedisClient(),
    });
  } catch (e) {
    console.error(e);
  }
}

export { pubsub, createPubSub };
