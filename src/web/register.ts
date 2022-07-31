import express, { Express } from "express";
import cors from "cors";
import createIframe from "node-iframe";
import { corsOptions, config } from "../config";
import cookieParser from "cookie-parser";
import { limiter, scanLimiter } from "./limiters/scan";
import path from "path";

export const registerExpressApp = (app: Express) => {
  app.disable("x-powered-by");

  app.set("trust proxy", true);
  // mw parsers
  app.use(cookieParser());
  app.use(cors(corsOptions));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json({ limit: "300mb" }));

  // rate limits on expensive endpoints
  if (!config.SUPER_MODE) {
    app.use("/playground", limiter);
    app.use("/grpc-docs", limiter);
    app.use("/api/iframe", limiter);
    app.use("/api/get-website", limiter);
    app.use("/api/register", limiter);
    app.use("/api/report", limiter);
    app.use("/api/login", limiter);
    app.use("/api/scan-simple", scanLimiter);
    app.use("/api/crawl", scanLimiter);
    app.use("/api/crawl-stream", scanLimiter);
    app.use("/api/image-check", scanLimiter); // TODO: REMOVE on next chrome store update
  }

  app.use(express.static(path.resolve("public")));

  app.use(createIframe);
};
