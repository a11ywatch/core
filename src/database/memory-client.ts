import { createClient } from "redis";
import type { RedisClientType } from "redis";

let redisClient: RedisClientType<any, any>;

const initRedisConnection = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_CLIENT ? process.env.REDIS_CLIENT : "",
      socket: {
        connectTimeout: 8000,
        noDelay: false,
      },
    });
    redisClient.on("error", (err) => console.error("Redis Client Error", err));
    await redisClient.connect();
  } catch (e) {
    console.log(e);
  }
};

initRedisConnection();

export { redisClient, initRedisConnection };
