import { redisClient } from "../../database/memory-client";

import {
  createRateLimitDirective,
  RedisStore as GraphQLRedisStore,
  getGraphQLRateLimiter,
} from "graphql-rate-limit";

let limiter = {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: "1 minute",
    },
  },
};
// crawl limiter
let scanLimiter = {
  config: {
    rateLimit: {
      max: 3,
      timeWindow: "1 minute",
    },
  },
};

let gqlRateLimiter; // graphql rate limit

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

export { gqlRateLimiter, limiter, scanLimiter, getGqlRateLimitDirective };
