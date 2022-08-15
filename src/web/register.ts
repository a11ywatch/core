import { FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import ratelimit from "@fastify/rate-limit";
import { createRedisClient } from "@app/database/memory-client";
import { cookieConfigs, SUPER_MODE } from "@app/config/config";

/*
 * fastify application register addons
 * @params app - fastify
 * @returns void
 */
export const registerApp = async (app: FastifyInstance) => {
  // setup global rate limiting
  if (!SUPER_MODE) {
    await app.register(ratelimit, {
      max: 100,
      timeWindow: "1 minute",
      redis: createRedisClient(),
    });
  }
  await app.register(cookie, {
    parseOptions: cookieConfigs,
  });

  return app;
};
