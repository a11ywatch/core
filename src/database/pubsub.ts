import { RedisPubSub } from "graphql-redis-subscriptions";
import Redis from "ioredis";

export const options = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: 6379,
};

let pubsub: RedisPubSub;
let sub: Redis.Redis;

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

function createSub() {
  try {
    sub = new Redis(options);
  } catch (e) {
    console.error(e);
  }
}

export { pubsub, sub, createPubSub, createSub };
