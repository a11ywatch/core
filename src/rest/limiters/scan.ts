import rateLimit from "express-rate-limit";
import Redis from "ioredis";
import RedisStore from "rate-limit-redis";
import { options } from "@app/database/pubsub";

let limiter;
let scanLimiter;

const connectLimiters = () => {
  try {
    const sub = new Redis(options);

    limiter = rateLimit({
      windowMs: 1 * 60 * 1000, // 60 seconds
      max: 30, // Limit each IP to 30 requests per `window` (here, per minute)
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false,
      store: new RedisStore({
        // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
        sendCommand: (...args: string[]) => sub.call(...args),
      }),
    });

    scanLimiter = rateLimit({
      windowMs: 1 * 30 * 1000, // 30 seconds
      max: 5, // Limit each IP to 5 requests per `window` (here, per 30 secs)
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false,
      store: new RedisStore({
        // @ts-expect-error - Known issue: the `call` function is not present in @types/ioredis
        sendCommand: (...args: string[]) => sub.call(...args),
      }),
    });
  } catch (e) {
    console.error(e);
  }
};

export { limiter, scanLimiter, connectLimiters };
