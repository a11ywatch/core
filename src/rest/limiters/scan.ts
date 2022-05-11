import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redisClient } from "@app/database/memory-client";

let limiter;
let scanLimiter;
let store; // redis store to use

const connectLimiters = () => {
  store = new RedisStore({
    // @ts-expect-error
    sendCommand: (...args: string[]) => redisClient.call(...args),
  });
  try {
    limiter = rateLimit({
      windowMs: 1 * 60 * 1000, // 60 seconds
      max: 30, // Limit each IP to 30 requests per `window` (here, per minute)
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false,
      store,
    });

    scanLimiter = rateLimit({
      windowMs: 1 * 30 * 1000, // 30 seconds
      max: 5, // Limit each IP to 5 requests per `window` (here, per 30 secs)
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false,
      store,
    });
  } catch (e) {
    console.error(e);
  }
};

export { store, limiter, scanLimiter, connectLimiters };
