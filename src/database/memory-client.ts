import Redis, { RedisOptions } from "ioredis";

const redisLogEnabled = process.env.REDIS_LOG_ENABLED === "true";

let redisConnected = false; // determine all redis connectivity
let redisClient: Redis;

const options: RedisOptions = {
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

const createRedisClient = () => {
  let newClient = null;

  try {
    newClient = new Redis(options);
  } catch (e) {
    // silent
  }

  if (newClient) {
    newClient?.on("error", (error) => {
      redisLogEnabled && console.error("redis error", error);
      redisConnected = false;
    });

    newClient?.on("connect", () => {
      redisConnected = true;
    });
  }

  return newClient;
};

// redis top level client
const initRedisConnection = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    const client = createRedisClient();

    if (client) {
      redisClient = client;
    }

    if (redisClient) {
      redisClient
        .connect()
        .catch((_) => {})
        .finally(() => {
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
  if (redisClient) {
    try {
      redisClient?.disconnect();
    } catch (e) {
      console.error(e);
    }
  }
};

export {
  createRedisClient,
  redisClient,
  initRedisConnection,
  closeRedisConnection,
  redisConnected,
};
