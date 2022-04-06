import type { Server as HttpServer } from "http";
import type { AddressInfo } from "net";
import express from "express";
import http from "http";
import https from "https";
import cors from "cors";
import createIframe from "node-iframe";
import { CronJob } from "cron";
import {
  corsOptions,
  config,
  cdnBase,
  logServerInit,
  PRIVATE_KEY,
  PUBLIC_KEY,
} from "./config";
import { crawlAllAuthedWebsitesCluster } from "./core/controllers/websites";
import { createIframe as createIframeEvent } from "./core/controllers/iframe";
import cookieParser from "cookie-parser";
import { scanWebsite as scan } from "@app/core/controllers/subdomains/update";
import fetcher from "node-fetch";

import {
  CONFIRM_EMAIL,
  IMAGE_CHECK,
  ROOT,
  WEBSITE_CRAWL,
  UNSUBSCRIBE_EMAILS,
} from "./core/routes";
import {
  initDbConnection,
  closeDbConnection,
  setChannels,
  createPubSub,
  initRedisConnection,
} from "./database";
import { Server } from "./apollo-server";
import {
  confirmEmail,
  detectImage,
  root,
  unSubEmails,
  websiteCrawl,
  getWebsite,
} from "./rest/routes";
import { logPage } from "./core/controllers/analytics/ga";
import { statusBadge } from "./rest/routes/resources/badge";

import { setCrawlManagerRoutes } from "./rest/routes_groups/crawl-manager";
import { setGithubActionRoutes } from "./rest/routes_groups/github-actions";
import { setAnnouncementsRoutes } from "./rest/routes_groups/announcements";
import { setAuthRoutes } from "./rest/routes_groups/auth";
import { createSub } from "./database/pubsub";
import { limiter, scanLimiter, connectLimiters } from "./rest/limiters/scan";

const internalPwd = process.env.INTERNAL_PWD || "INTERNAL_PWD";

// only internal servers can use endpoints
const internalOnlyMiddleware = (req, res, next) => {
  // TODO: MOVE TO PRIVATE MICRO-SERVICE
  if (req.headers["authentication"] === internalPwd) {
    next();
  } else {
    res.json({ error: "Access denied" });
  }
};

function initServer(): HttpServer {
  const app = express();
  const { GRAPHQL_PORT } = config;

  app.disable("x-powered-by");
  app.set("trust proxy", process.env.NODE_ENV !== "production");
  app.use(cookieParser());
  app.use(cors(corsOptions));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json({ limit: "300mb" }));

  app.use(WEBSITE_CRAWL, internalOnlyMiddleware);
  app.use(`${WEBSITE_CRAWL}-*`, internalOnlyMiddleware); // todo: strict routes

  // rate limits
  app.use("/iframe", limiter);
  app.use("/api/get-website", limiter);
  app.use("/api/register", limiter);
  app.use("/api/scan-simple", scanLimiter);
  app.use("/api/image-check", scanLimiter); // TODO: REMOVE on next chrome store update

  app.use(createIframe);
  app.options(CONFIRM_EMAIL, cors());

  app.get(ROOT, root);

  app.get("/iframe", cors(), createIframeEvent);
  app.get("/status/:domain", cors(), statusBadge);
  app.get("/api/get-website", cors(), getWebsite);
  app.get(UNSUBSCRIBE_EMAILS, cors(), unSubEmails);

  // CLI OPTIONS MOVE TO DIRECTORY
  app.post("/api/scan-simple", cors(), async (req, res) => {
    try {
      const url = req.body?.websiteUrl || req.body?.url;
      const userId: number = req.body?.userId;

      const data = await scan({
        url: decodeURIComponent(url + ""),
        userId,
      });

      // TODO: PASS PARAM INSTEAD TO REMOVE TRANSFER OF DATA
      if (data?.website?.html) {
        delete data.website.html;
      }

      res.json(data);
    } catch (e) {
      console.error(e);
      res.json(false);
    }
  });

  // private routes for watcher [TODO: ADD HEADER AUTH OR MOVE TO PRIVATE SERVICE]
  app.post(WEBSITE_CRAWL, websiteCrawl);
  app.post(`${WEBSITE_CRAWL}-background`, websiteCrawl); // TODO: remove endpoint

  // get base64 to image name
  app.post(IMAGE_CHECK, cors(), detectImage);

  app.route(CONFIRM_EMAIL).get(cors(), confirmEmail).post(cors(), confirmEmail);

  // CDN SERVER TODO: USE DOWNLOAD PATH INSTEAD
  app.get("/scripts/:domain/:cdnPath", async (req, res) => {
    try {
      const request = await fetcher(
        `${cdnBase}/${req.params.domain}/${req.params.cdnPath}`
      );
      const data = await request.text();

      res.setHeader(
        "Content-disposition",
        "attachment; filename=" + `${req.params.cdnPath}`
      );

      return res.send(data);
    } catch (error) {
      console.error(error);
    }
  });

  // AUTH ROUTES
  setAuthRoutes(app);
  // Announcements from the application (new features etc)
  setAnnouncementsRoutes(app);
  // Crawler service manager control
  setCrawlManagerRoutes(app);
  // GITHUB
  setGithubActionRoutes(app);
  // ADMIN ROUTES
  app.post("/api/run-watcher", cors(), async (req, res) => {
    const { password } = req.body;
    try {
      if (password === process.env.ADMIN_PASSWORD) {
        await crawlAllAuthedWebsitesCluster();
        res.send(true);
      } else {
        res.send(false);
      }
    } catch (e) {
      console.error(e);
    }
  });
  /*  ANALYTICS */
  app.post("/api/log/page", cors(), logPage);
  // INTERNAL
  app.get("/_internal_/healthcheck", async (_, res) => {
    res.send({
      status: "healthy",
    });
  });
  //An error handling middleware
  app.use(function (err, _req, res, next) {
    if (res.headersSent) {
      return next(err);
    }
    res.status(500);
    res.json({ error: err });
  });

  const server = new Server();
  server.applyMiddleware({ app, cors: corsOptions });

  let httpServer;
  if (process.env.ENABLE_SSL === "true") {
    httpServer = https.createServer(
      {
        key: PRIVATE_KEY,
        cert: PUBLIC_KEY,
      },
      app
    );
  } else {
    httpServer = http.createServer(app);
  }

  server.installSubscriptionHandlers(httpServer);
  const listener = httpServer.listen(GRAPHQL_PORT);

  logServerInit((listener.address() as AddressInfo).port, {
    subscriptionsPath: server.subscriptionsPath,
    graphqlPath: server.graphqlPath,
  });

  if (process.env.DYNO === "web.1" || !process.env.DYNO) {
    new CronJob("0 11,23 * * *", crawlAllAuthedWebsitesCluster).start();
  }

  return listener;
}

let coreServer: HttpServer;

const startServer = (async () => {
  try {
    await initDbConnection();
    createPubSub(); //gql sub
    createSub(); // pub sub
    setChannels(); // queues
    initRedisConnection(); // redis client
    connectLimiters(); // rate limiters
  } catch (e) {
    console.error(e);
  }
  try {
    coreServer = initServer();
  } catch (e) {
    console.error(["SERVER FAILED TO START", e]);
  }
})();

const killServer = async () => {
  try {
    await Promise.all([closeDbConnection(), coreServer.close()]);
  } catch (e) {
    console.error("failed to kill server", e);
  }
};

export { killServer, initServer, startServer };
export default coreServer;
