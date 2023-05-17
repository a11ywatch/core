import Redis from "ioredis";

const redisLogEnabled = process.env.REDIS_LOG_ENABLED === "true";

let redisConnected = false; // determine all redis connectivity
let redisClient: Redis;

const options = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: 6379,
  autoResubscribe: false,
  autoResendUnfulfilledCommands: false,
  maxRetriesPerRequest: 0,
  lazyConnect: true,
  enableAutoPipelining: true,
  retryStrategy(times) {
    redisLogEnabled &&
      console.warn(`Retrying redis connection: attempt ${times}`);
    return null;
  },
  reconnectOnError(err) {
    if (err.message.includes("READONLY")) {
      return true;
    }
    return null;
  },
};

// redis top level client
const initRedisConnection = async (): Promise<boolean> => {
  return new Promise((resolve) => {
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
    if (redisClient) {
      redisClient.connect().finally(() => {
        resolve(redisConnected);
      });
    } else {
      redisConnected = false;
      resolve(false);
    }
  });
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
