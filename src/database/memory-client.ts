import Redis from "ioredis";

const redisLogEnabled = process.env.REDIS_LOG_ENABLED === "true";

let redisConnected = true; // determine all redis connectivity
let redisClient: Redis;

const options = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: 6379,
  autoResubscribe: false,
  maxRetriesPerRequest: undefined,
  lazyConnect: true,
  enableAutoPipelining: true,
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

// redis top level client
const initRedisConnection = async () => {
  try {
    redisClient = new Redis(options);
    redisClient?.on("error", (error) => {
      redisLogEnabled && console.error("redis error", error);
      redisConnected = false;
    });
    redisClient?.on("connect", () => {
      redisConnected = true;
    });
  } catch (e) {
    console.error(e);
  }
};

// close redis client
const closeRedisConnection = () => {
  try {
    redisClient?.disconnect();
  } catch (e) {
    console.error(e);
  }
};

const createRedisClient = () => {
  const newClient = new Redis(options);

  newClient?.on("error", (error) => {
    redisLogEnabled && console.error("redis error", error);
    redisConnected = false;
  });

  newClient?.on("connect", () => {
    redisConnected = true;
  });

  return newClient;
};

export {
  createRedisClient,
  redisClient,
  initRedisConnection,
  closeRedisConnection,
  redisConnected,
};
