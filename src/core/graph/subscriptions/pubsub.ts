import { RedisPubSub } from "graphql-redis-subscriptions";
import Redis from "ioredis";

const redisHost = process.env.REDIS_HOST || "127.0.0.1";

const options = {
  host: redisHost,
  port: 6379,
  retryStrategy: (times) => {
    return Math.min(times * 50, 2000);
  },
};

export const pubsub = new RedisPubSub({
  publisher: new Redis(options),
  subscriber: new Redis(options),
});
