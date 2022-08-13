import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redisClient } from "@app/database/memory-client";
import {
  createRateLimitDirective,
  RedisStore as GraphQLRedisStore,
  getGraphQLRateLimiter,
} from "graphql-rate-limit";

let limiter; // generic limiter
let scanLimiter; // website scans for new reports and crawls
let store; // redis store to use
let gqlRateLimiter; // graphql rate limit

const connectLimiters = () => {
  try {
    store = new RedisStore({
      // @ts-ignore
      sendCommand: (...args: string[]) => redisClient.call(...args),
    });
  } catch (e) {
    console.error(e);
  }

  // setup rate limits
  if (store) {
    try {
      limiter = rateLimit({
        windowMs: 1 * 60 * 1000, // 60 seconds
        max: 30, // Limit each IP to 30 API requests per `window` (here, per minute)
        standardHeaders: true,
        legacyHeaders: false,
        store,
        keyGenerator: (request, _response) =>
          request.header["x-forwarded-for"] || request.ip,
      });

      scanLimiter = rateLimit({
        windowMs: 1 * 30 * 1000, // 30 seconds
        max: 3, // Limit each IP to 3 requests per `window` (here, per 30 secs)
        standardHeaders: true,
        legacyHeaders: false,
        store,
      });
    } catch (e) {
      console.error(e);
    }
  }
};

const getGqlRateLimitDirective = () => {
  try {
    const rateLimitOptions = {
      identifyContext: (ctx) =>
        ctx?.request?.ipAddress || ctx.id || (ctx.user && ctx.user.id),
      formatError: ({ fieldName, window }) =>
        `Rate limited exceeded for ${fieldName}. Please wait ${
          window / 1000
        }s and try again`,
      store: new GraphQLRedisStore(redisClient),
    };
    gqlRateLimiter = getGraphQLRateLimiter(rateLimitOptions);

    return createRateLimitDirective(rateLimitOptions);
  } catch (e) {
    console.error(e);
  }
};

export {
  gqlRateLimiter,
  store,
  limiter,
  scanLimiter,
  getGqlRateLimitDirective,
  connectLimiters,
};
