import { RedisPubSub } from "graphql-redis-subscriptions";
import Redis from "ioredis";

export const options = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: 6379,
};

let pubsub: RedisPubSub;
let sub: Redis.Redis;

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

// used as primary redis sub
function createSub() {
  new Promise((resolve) => {
    try {
      sub = new Redis(options);
      resolve(sub);
    } catch (e) {
      console.error(e);
    }
  });
}

// used as primary redis sub
async function closeSub() {
  try {
    await pubsub?.close();
    sub?.disconnect();
  } catch (e) {
    console.error(e);
  }
}

export { pubsub, sub, createPubSub, createSub, closeSub };
