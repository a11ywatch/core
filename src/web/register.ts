import cookie from "@fastify/cookie";
import { FastifyInstance } from "fastify";
import { createRedisClient } from "@app/database/memory-client";
import ratelimit from "@fastify/rate-limit";
import { cookieConfigs } from "@app/config";

/*
 * fastify application setup middlewares
 * @params app - fastify
 * @returns void
 */
export const registerApp = async (app: FastifyInstance) => {
  await app.register(ratelimit, {
    max: 100,
    timeWindow: "1 minute",
    redis: createRedisClient(),
  });
  await app.register(cookie, {
    parseOptions: cookieConfigs,
  });

  return app;
};
