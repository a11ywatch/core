import { createClient, RedisClientType } from "redis";

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

    return redisClient;
  } catch (e) {
    console.log(e);
  }
};

initRedisConnection();

export { redisClient, initRedisConnection };
