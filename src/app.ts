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
  createPubSub,
  initRedisConnection,
  closeSub,
  closeRedisConnection,
} from "./database";
import { confirmEmail, detectImage, root, unSubEmails } from "./rest/routes";
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
import { getUserFromToken, httpGet } from "./core/utils";
import { retreiveUserByToken } from "./core/utils/get-user-data";
import { responseModel } from "./core/models";
import { ApolloServer } from "apollo-server-express";
import { getWebsiteAPI, getWebsiteReport } from "./rest/routes/data/website";
import { getWebsite } from "@app/core/controllers/websites";
import { AnalyticsController } from "./core/controllers";
import { crawlStreamLazy } from "./core/streams/crawl";
import { crawlRest } from "./rest/routes/crawl";
import { getWebsitesPaging } from "./core/controllers/websites/find/get";

const { GRAPHQL_PORT } = config;

configureAgent();

let server;

// all the clients for external request
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
    connectLimiters(); // rate limiters
  } catch (e) {
    console.error(e);
  }

  const { getServerConfig } = await import("./apollo-server");

  server = new ApolloServer(getServerConfig());
};

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
    app.use("/api/report", limiter);
    app.use("/api/login", limiter);
    app.use("/api/scan-simple", scanLimiter);
    app.use("/api/crawl", scanLimiter);
    app.use("/api/crawl-ctream", scanLimiter);
    app.use("/api/image-check", scanLimiter); // TODO: REMOVE on next chrome store update
  }
  app.use(createIframe);
  app.options(CONFIRM_EMAIL, cors());
  app.options(UNSUBSCRIBE_EMAILS, cors());
  // root
  app.get(ROOT, root);
  /*
   * Create an iframe based off a url and reverse engineer the content for CORS.
   * Uses node-iframe package to handle iframes.
   */
  app.get("/iframe", cors(), createIframeEvent);
  app.get("/status/:domain", cors(), statusBadge);
  // get a previus run report @query {q: string}
  app.get("/api/report", cors(), getWebsiteReport);
  // retreive a user from the database.
  app.get("/api/user", cors(), async (req, res) => {
    let data;
    try {
      const [user] = await retreiveUserByToken(req.headers.authorization);
      if (user) {
        data = user;
      }
    } catch (_) {}

    res.json(
      responseModel({
        data,
        message: data
          ? "Successfully retrieved user."
          : "Failed to retrieved user.",
      })
    );
  });
  // retreive a website from the database.
  app.get("/api/website", cors(), async (req, res) => {
    let data;
    let code = 200;
    let message = "Failed to retrieved website.";

    const usr = getUserFromToken(req.headers.authorization);

    try {
      [data] = await getWebsite({
        userId: usr?.payload?.keyid,
        domain: decodeURIComponent(req.query.domain + ""),
      });
      message = "Successfully retrieved website.";
    } catch (e) {
      code = 400;
      message = `${message} - ${e}`;
    }

    res.json(
      responseModel({
        code,
        data: data ? data : null,
        message,
      })
    );
  });
  // retreive a page analytic from the database.
  app.get("/api/analytics", cors(), async (req, res) => {
    let data;
    let code = 200;
    let message = "Failed to retrieved analytic.";

    const usr = getUserFromToken(req.headers.authorization);

    try {
      data = await AnalyticsController().getWebsite({
        userId: usr?.payload?.keyid,
        pageUrl: decodeURIComponent(String(req.query.pageUrl || req.query.url)),
        domain: req.query.domain ? req.query.domain + "" : undefined,
      });
      message = "Successfully retrieved analytic for page.";
    } catch (e) {
      code = 400;
      message = `${message} - ${e}`;
    }

    res.json(
      responseModel({
        code,
        data: data ? data : null,
        message,
      })
    );
  });

  // paginated retreive a websites from the database.
  app.get("/api/list/website", cors(), async (req, res) => {
    const usr = getUserFromToken(req.headers.authorization);
    let data;
    let code = 200;
    let message = "Failed to retrieved websites.";

    try {
      [data] = await getWebsitesPaging({
        userId: usr?.payload?.keyid,
        limit: 2,
        offset: Number(req.query.offset) || 0,
      });
      message = "Successfully retrieved websites.";
    } catch (e) {
      code = 400;
      message = `${message} - ${e}`;
    }

    res.json(
      responseModel({
        code,
        data: data ? data : null,
        message,
      })
    );
  });

  /*
   * Single page scan
   */
  app.post("/api/scan-simple", cors(), scanSimple);
  /*
   * Site wide scan.
   * Uses Event based handling to get pages max timeout 30s.
   */
  app.post("/api/crawl", cors(), crawlRest);

  /*
   * Site wide scan handles via stream.
   * Uses Event based handling to get pages max timeout 30s.
   * Sends a scan in progress response every 500ms.
   * TODO: use real time crawl API for response feedback on crawl.
   */
  app.post("/api/crawl-stream", cors(), crawlStreamLazy);

  // get base64 to image name
  app.post(IMAGE_CHECK, cors(), detectImage);

  // END of ACTIONS

  // TODO: remove script downloading
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

  // used for reports on client-side Front-end. TODO: remove for /reports/ endpoint.
  app.get("/api/get-website", cors(), getWebsiteAPI);

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
        setImmediate(async () => {
          await crawlAllAuthedWebsitesCluster();
        });
        res.send(true);
      } else {
        res.send(false);
      }
    } catch (e) {
      console.error(e);
    }
  });

  // EMAIL handling
  // unsubscribe to emails or Alerts.
  app
    .route(UNSUBSCRIBE_EMAILS)
    .get(cors(), unSubEmails)
    .post(cors(), unSubEmails);

  // email confirmation route
  app.route(CONFIRM_EMAIL).get(cors(), confirmEmail).post(cors(), confirmEmail);

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

  server.applyMiddleware({ app, cors: corsOptions });

  let httpServer: HttpServer;

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
    // compatability with heroku dynos if deployed.
    if (process.env.DYNO === "web.1" || !process.env.DYNO) {
      new CronJob("0 11,23 * * *", crawlAllAuthedWebsitesCluster).start();
    }
  }

  return [listener];
}

let coreServer: HttpServer;

const startServer = async () => {
  await connectClients(); // START ALL EXTERNAL CLIENTS LIKE REDIS ETC.

  try {
    await startGRPC();
  } catch (e) {
    console.error(e);
  }

  if (config.SUPER_MODE) {
    console.log("Application started in SUPER mode. All restrictions removed.");
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
