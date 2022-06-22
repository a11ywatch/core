import { RedisPubSub } from "graphql-redis-subscriptions";
import Redis from "ioredis";

export const options = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: 6379,
};

let pubsub: RedisPubSub;

// PUB/SUB GQL
function createPubSub() {
  try {
    pubsub = new RedisPubSub({
      publisher: new Redis(options),
      subscriber: new Redis(options),
    });
  } catch (e) {
    console.error(e);
  }
}

export { pubsub, createPubSub };
