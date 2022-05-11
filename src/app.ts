import type { Server as HttpServer } from "http";
import type { AddressInfo } from "net";
import express from "express";
import http from "http";
import https from "https";
import cors from "cors";
import createIframe, { configureAgent } from "node-iframe";
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

import {
  CONFIRM_EMAIL,
  IMAGE_CHECK,
  ROOT,
  UNSUBSCRIBE_EMAILS,
} from "./core/routes";
import {
  initDbConnection,
  closeDbConnection,
  setChannels,
  createPubSub,
  initRedisConnection,
  closeSub,
  closeRedisConnection,
} from "./database";
import { Server } from "./apollo-server";
import {
  confirmEmail,
  detectImage,
  root,
  unSubEmails,
  getWebsite,
  websiteCrawl,
} from "./rest/routes";
import { logPage } from "./core/controllers/analytics/ga";
import { statusBadge } from "./rest/routes/resources/badge";
import { scanSimple } from "./rest/routes/scan";
import { setGithubActionRoutes } from "./rest/routes_groups/github-actions";
import { setAnnouncementsRoutes } from "./rest/routes_groups/announcements";
import { setAuthRoutes } from "./rest/routes_groups/auth";
import { createSub } from "./database/pubsub";
import { limiter, scanLimiter, connectLimiters } from "./rest/limiters/scan";
import { startGRPC } from "./proto/init";
import { killServer as killGrpcServer } from "./proto/website-server";
import { httpGet } from "./core/utils";
import { getUserFromApiScan } from "./core/utils/get-user-data";
import { watcherCrawl } from "./core/utils/watcher_crawl";
import { responseModel } from "./core/models";

const { GRAPHQL_PORT } = config;

configureAgent();

function initServer(): HttpServer[] {
  const app = express();

  app.disable("x-powered-by");

  app.set("trust proxy", 1);
  // mw parsers
  app.use(cookieParser());
  app.use(cors(corsOptions));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json({ limit: "300mb" }));

  // rate limits on expensive endpoints
  if (!config.SUPER_MODE) {
    app.use("/iframe", limiter);
    app.use("/api/get-website", limiter);
    app.use("/api/register", limiter);
    app.use("/api/scan-simple", scanLimiter);
    app.use("/api/image-check", scanLimiter); // TODO: REMOVE on next chrome store update
  }

  app.use(createIframe);
  app.options(CONFIRM_EMAIL, cors());
  app.options(UNSUBSCRIBE_EMAILS, cors());

  app.get(ROOT, root);

  app.get("/iframe", cors(), createIframeEvent);
  app.get("/status/:domain", cors(), statusBadge);
  app.get("/api/get-website", cors(), getWebsite);
  app
    .route(UNSUBSCRIBE_EMAILS)
    .get(cors(), unSubEmails)
    .post(cors(), unSubEmails);

  /*
   * Single page scan
   */
  app.post("/api/scan-simple", cors(), scanSimple);

  /*
   * Multi page scan pushed to queue
   */
  app.post("/api/crawl", cors(), async (req, res) => {
    try {
      const userNext = await getUserFromApiScan(
        req.headers.authorization,
        req,
        res
      );
      // add crawl to queue
      if (!!userNext) {
        await websiteCrawl(req, res);
      }
    } catch (e) {
      console.error(e);
    }
  });

  /*
   * Multi page scan directly [TODO:] remove for single crawl endpoint at v1
   */
  app.post("/api/scan-all", cors(), async (req, res) => {
    try {
      /*
       * Get the user if auth set or determine if request allowed.
       * This method handles sending headers and will return void next action should not occur.
       **/
      const userNext = await getUserFromApiScan(
        req.headers.authorization,
        req,
        res
      );

      if (!!userNext) {
        setImmediate(async () => {
          const url = req.body?.websiteUrl || req.body?.url;

          await watcherCrawl({ urlMap: url, userId: userNext.id, scan: true });
        });
        res.json(
          responseModel({
            website: undefined,
            message:
              "Site-wide scan commenced. Check the browser to see results.",
          })
        );
      }
    } catch (e) {
      console.error(e);
    }
  });

  // get base64 to image name
  app.post(IMAGE_CHECK, cors(), detectImage);
  // email confirmation route
  app.route(CONFIRM_EMAIL).get(cors(), confirmEmail).post(cors(), confirmEmail);

  // CDN SERVER TODO: USE DOWNLOAD PATH INSTEAD
  app.get("/scripts/:domain/:cdnPath", async (req, res) => {
    try {
      const data = await httpGet(
        `${cdnBase}/${req.params.domain}/${req.params.cdnPath}`
      );

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

  if (process.env.NODE_ENV !== "test") {
    if (process.env.DYNO === "web.1" || !process.env.DYNO) {
      new CronJob("0 11,23 * * *", crawlAllAuthedWebsitesCluster).start();
    }
  }

  return [listener];
}

let coreServer: HttpServer;

const connectClients = async () => {
  try {
    await initDbConnection();
  } catch (e) {
    console.error(e);
  }
  try {
    await initRedisConnection(); // redis client
  } catch (e) {
    console.error(e);
  }
  try {
    await createSub(); // pub sub
  } catch (e) {
    console.error(e);
  }

  try {
    createPubSub(); //gql sub
    setChannels(); // queues
    connectLimiters(); // rate limiters
  } catch (e) {
    console.error(e);
  }
};

const startServer = async () => {
  await connectClients();

  try {
    await startGRPC();
  } catch (e) {
    console.error(e);
  }

  return new Promise(async (resolve, reject) => {
    try {
      [coreServer] = initServer();

      resolve([coreServer]);
    } catch (e) {
      console.error(["SERVER FAILED TO START", e]);
      reject(e);
    }
  });
};

const killServer = async () => {
  try {
    await Promise.all([
      coreServer?.close(),
      closeDbConnection(),
      closeSub(),
      closeRedisConnection(),
      killGrpcServer(),
    ]);
  } catch (e) {
    console.error("failed to kill server", e);
  }
};

export { coreServer, killServer, initServer, startServer };
