import { RedisPubSub } from "graphql-redis-subscriptions";
import Redis from "ioredis";

export const options = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: 6379,
  autoResubscribe: false,
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy(times) {
    redisLogEnabled &&
      console.warn(`Retrying redis connection: attempt ${times}`);
    return Math.min(times * 500, 2000);
  },
  reconnectOnError(err) {
    const targetError = "READONLY";
    if (err.message.includes(targetError)) {
      return true;
    }
  },
};

let pubsub: RedisPubSub;
const redisLogEnabled = process.env.REDIS_LOG_ENABLED === "true";

// PUB/SUB GQL
function createPubSub() {
  let publisher;
  let subscriber;
  try {
    publisher = new Redis(options);
  } catch (e) {
    console.error(e);
  }
  try {
    subscriber = new Redis(options);
  } catch (e) {
    console.error(e);
  }
  subscriber?.on(
    "error",
    (error) => redisLogEnabled && console.error("redis error", error)
  );
  try {
    pubsub = new RedisPubSub({
      publisher,
      subscriber,
    });
  } catch (e) {
    console.error(e);
  }
}

export { pubsub, createPubSub };
