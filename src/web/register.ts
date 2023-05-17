import { FastifyInstance } from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import ratelimit from "@fastify/rate-limit";
import { redisClient } from "../database/memory-client";
import { cookieConfigs, SUPER_MODE } from "../config/config";
import { stripeHook } from "./routes_groups/stripe";

/*
 * fastify application register addons
 * @params app - fastify
 * @returns void
 */
export const registerApp = async (app: FastifyInstance) => {
  await app.register(cors, {
    origin: true,
  });

  await app.register(cookie, {
    parseOptions: cookieConfigs,
  });

  // stripe web hooks
  await app.register((fastify, _opts, next) => {
    fastify.addContentTypeParser(
      "application/json",
      { parseAs: "buffer" },
      function (req, body, done) {
        try {
          done(null, {
            raw: body,
          });
        } catch (error) {
          error.statusCode = 400;
          done(error, undefined);
        }
      }
    );

    fastify.post("/api/stripes/event", {
      handler: stripeHook,
    });

    next();
  });

  // setup global rate limiting
  if (!SUPER_MODE) {
    await app.register(ratelimit, {
      max: 50,
      timeWindow: "1 minute",
      redis: redisClient,
    });
  }

  return app;
};
