import Redis from "ioredis";

let redisClient: Redis.Redis;

const options = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: 6379,
};

// redis client
const initRedisConnection = async () => {
  try {
    redisClient = new Redis(options);
  } catch (e) {
    console.log(e);
  }
};

// close redis client
const closeRedisConnection = () => {
  try {
    redisClient?.disconnect();
  } catch (e) {
    console.log(e);
  }
};

export { redisClient, initRedisConnection, closeRedisConnection };
