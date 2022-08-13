import type { Server as HttpServer } from "http";
import type { AddressInfo } from "net";
import express from "express";
import http from "http";
import https from "https";
import cors from "cors";
import { configureAgent } from "node-iframe";
import { CronJob } from "cron";
import path from "path";

import {
  corsOptions,
  config,
  logServerInit,
  PRIVATE_KEY,
  PUBLIC_KEY,
  whitelist,
} from "./config";
import { crawlAllAuthedWebsitesCluster } from "./core/controllers/websites";
import { createIframe as createIframeEvent } from "./core/controllers/iframe";
import { getBaseParams, paramParser } from "./web/params/extracter";
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
  closeRedisConnection,
} from "./database";
import { confirmEmail, detectImage, root, unSubEmails } from "./web/routes";
import { statusBadge } from "./web/routes/resources/badge";
import { scanSimple } from "./web/routes/scan";
import { setGithubActionRoutes } from "./web/routes_groups/github-actions";
import { setAuthRoutes } from "./web/routes_groups/auth";
import { connectLimiters } from "./web/limiters/scan";
import { startGRPC } from "./proto/init";
import { killServer as killGrpcServer } from "./proto/website-server";
import { getUserFromToken, parseCookie } from "./core/utils";
import { retreiveUserByTokenWrapper } from "./core/utils/get-user-data";
import { responseModel } from "./core/models";
import { ApolloServer, ExpressContext } from "apollo-server-express";
import { getWebsiteAPI, getWebsiteReport } from "./web/routes/data/website";
import { AnalyticsController } from "./core/controllers";
import { crawlStream } from "./core/streams/crawl";
import { crawlStreamSlim } from "./core/streams/crawl-slim";
import { crawlRest } from "./web/routes/crawl";
import { getServerConfig } from "./apollo-server";
import { establishCrawlTracking } from "./event";
import { updateWebsite } from "./core/controllers/websites/update";
import { graphqlPlayground } from "./html";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { execute, subscribe } from "graphql";
import { PageSpeedController } from "./core/controllers/page-speed/main";
import { registerExpressApp } from "./web/register";
import { setListRoutes } from "./web/routes_groups/list";
import { StatusCode } from "./web/messages/message";
import { responseWrap } from "./web/response";
import { getWebParams } from "./web/params/web";
import { addWebsiteWrapper } from "./core/controllers/websites/set/add-website";
import { getWebsiteWrapper } from "./core/controllers/websites/find/get";

const { GRAPHQL_PORT } = config;

// configure one app-wide setting for user agents on node-iframe request
configureAgent();

// all the clients for external request
const connectClients = async () => {
  await initDbConnection(); // database connections
  await initRedisConnection(); // redis connections

  createPubSub(); //gql sub
  connectLimiters(); // rate limiters
};

const allowDocDomains = [...whitelist]; // vercel.com for getStaticProps building pages. [TODO: move files out of this system]

function initServer(): HttpServer[] {
  const app = express();
  let server: ApolloServer<ExpressContext>;

  // setup all middlewares and app settings
  registerExpressApp(app);

  // email handling
  app.options(CONFIRM_EMAIL, cors());
  app.options(UNSUBSCRIBE_EMAILS, cors());

  // root
  app.get(ROOT, root);

  app.get("/status/:domain", cors(), statusBadge);

  app.get("/playground", (_req, res) => {
    res.send(graphqlPlayground);
  });

  // TODO: move to client
  app.get("/grpc-docs", cors(), (req, res) => {
    const origin = req.get("origin");

    if (allowDocDomains.includes(origin)) {
      res.set("Access-Control-Allow-Origin", origin);
    }

    res.sendFile(path.resolve("public/protodoc/index.html"));
  });

  /*
   * Create an iframe based off a url and reverse engineer the content for CORS.
   * Uses node-iframe package to handle iframes.
   */
  app.get("/api/iframe", cors(), createIframeEvent);
  // get a previus run report @query {q: string}
  app.get("/api/report", cors(), getWebsiteReport);
  // retrieve a user from the database.
  app.get("/api/user", cors(), async (req, res) => {
    const auth = req.headers.authorization;

    await responseWrap(res, {
      callback: () => retreiveUserByTokenWrapper(auth),
      auth,
    });
  });

  // retrieve a website from the database. TODO: cleanup
  app.get("/api/website", cors(), async (req, res) => {
    const { userId, domain, pageUrl } = getBaseParams(req);

    await responseWrap(res, {
      callback: () =>
        getWebsiteWrapper({
          userId,
          domain,
          url: pageUrl,
        }),
      userId,
    });
  });

  // retrieve a page analytic from the database.
  app.get("/api/analytics", cors(), async (req, res) => {
    const { userId, domain, pageUrl } = getBaseParams(req);

    await responseWrap(res, {
      callback: () =>
        AnalyticsController().getWebsite({
          userId,
          pageUrl: pageUrl ? pageUrl : undefined,
          domain: domain ? domain : undefined,
        }),
      userId,
    });
  });

  // retrieve a pagespeed from the database.
  app.get("/api/pagespeed", cors(), async (req, res) => {
    const { userId, domain, pageUrl } = getBaseParams(req);

    await responseWrap(res, {
      callback: () =>
        PageSpeedController().getWebsite({
          userId,
          pageUrl: pageUrl ? pageUrl : undefined,
          domain: domain ? domain : undefined,
        }),
      userId,
    });
  });

  /*
   * Single page scan
   */
  app.post("/api/scan-simple", cors(), scanSimple);
  /*
   * Site wide scan.
   * Uses Event based handling to get pages max timeout 15mins.
   */
  app.post("/api/crawl", cors(), crawlRest);

  /*
   * Site wide scan handles via stream.
   * Uses Event based handling to extract pages.
   */
  app.post("/api/crawl-stream", cors(), crawlStream);

  /*
   * Site wide scan handles via stream slim data sized.
   * Uses Event based handling to extract pages.
   */
  app.post("/api/crawl-stream-slim", cors(), crawlStreamSlim);

  // get base64 to image name
  app.post(IMAGE_CHECK, cors(), detectImage);

  /*
   * Update website configuration.
   * This sets the website configuration for crawling like user agents, headers, and etc.
   */
  app.put("/api/website", cors(), async (req, res) => {
    const usr = getUserFromToken(req.headers.authorization);
    const userId = usr?.payload?.keyid;

    if (typeof userId === "undefined") {
      res.status(StatusCode.Unauthorized);

      return res.json({
        data: null,
        message: "Authentication required",
      });
    }

    const url = paramParser(req, "url");
    const customHeaders = paramParser(req, "customHeaders");
    const mobile = paramParser(req, "mobile");
    const pageInsights = paramParser(req, "pageInsights");
    const ua = paramParser(req, "ua");
    const standard = paramParser(req, "standard");
    const actions = paramParser(req, "actions");

    const { website } = await updateWebsite({
      userId,
      url,
      pageHeaders: customHeaders,
      mobile,
      pageInsights,
      ua,
      standard,
      actions,
    });

    return res.json({
      data: website,
      message: "Website updated",
    });
  });

  /*
   * Add website.
   * This sets the website configuration for crawling like user agents, headers, and etc.
   */
  app.post("/api/website", cors(), async (req, res) => {
    const usr = getUserFromToken(req.headers.authorization);
    const userId = usr?.payload?.keyid;

    await responseWrap(res, {
      callback: () =>
        addWebsiteWrapper({
          userId,
          canScan: false,
          // configuration
          ...getWebParams(req),
        }),
      userId,
    });
  });

  // used for reports on client-side Front-end. TODO: remove for /reports/ endpoint.
  app.get("/api/get-website", cors(), getWebsiteAPI);

  // Paginated List Routes
  setListRoutes(app);
  // AUTH ROUTES
  setAuthRoutes(app);
  // GITHUB
  setGithubActionRoutes(app);
  // ADMIN ROUTES
  app.post("/api/run-watcher", cors(), async (req, res) => {
    const { password } = req.body;
    if (password === process.env.ADMIN_PASSWORD) {
      setImmediate(crawlAllAuthedWebsitesCluster);
      res.send(true);
    } else {
      res.send(false);
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
    res.status(StatusCode.Error);
    res.json(
      responseModel({
        code: StatusCode.Error,
        success: false,
        message: err,
      })
    );
  });

  let httpServer: HttpServer;
  let subscriptionServer;

  server = new ApolloServer(
    getServerConfig({
      plugins: [
        {
          async serverWillStart() {
            return {
              async drainServer() {
                subscriptionServer?.close();
              },
            };
          },
        },
      ],
    })
  );

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

  const listener = httpServer.listen(GRAPHQL_PORT);

  const { schema } = getServerConfig();

  subscriptionServer = SubscriptionServer.create(
    {
      schema,
      execute,
      subscribe,
      async onConnect(_cnxnParams, webSocket, _cnxnContext) {
        const cookie = webSocket?.upgradeReq?.headers?.cookie;
        const parsedCookie = parseCookie(cookie);
        const user = getUserFromToken(parsedCookie?.jwt || "");

        return {
          userId: user?.payload?.keyid,
        };
      },
    },
    {
      server: httpServer,
      path: server.graphqlPath,
    }
  );

  server.start().then(() => {
    server.applyMiddleware({ app, cors: corsOptions });

    logServerInit((listener.address() as AddressInfo).port, {
      graphqlPath: server.graphqlPath,
    });

    new CronJob("0 11,23 * * *", crawlAllAuthedWebsitesCluster).start();
    // TODO: nightly cron to handle redis page hits into db
  });

  return [listener];
}

// core http app server
let coreServer: HttpServer;

// determine if the server started
let serverInited = false;
let serverReady = false;

// start the http, graphl, events, subs, and gRPC server
const startServer = async () => {
  serverInited = true; // do not wait for express and rely on health check

  if (config.SUPER_MODE) {
    console.log("Application started in SUPER mode. All restrictions removed.");
  }

  // tracking event emitter
  establishCrawlTracking();

  // connect all clients
  await connectClients();

  // start the gRPC server
  await startGRPC();

  return new Promise(async (resolve, reject) => {
    try {
      [coreServer] = initServer();

      serverReady = true;

      resolve([coreServer]);
    } catch (e) {
      console.error(["SERVER FAILED TO START", e]);
      reject(e);
    }
  });
};

// determine if the server is completly ready
const isReady = async () => {
  return new Promise((resolve) => {
    if (serverReady) {
      resolve(true);
    } else {
      // TODO: listen for event emitt
      const serverInterval = setInterval(() => {
        if (serverReady) {
          clearInterval(serverInterval);
          resolve(true);
        }
      }, 3);

      // give 75 ms to wait for server to start before clearing out if server has not inited
      if (!serverInited) {
        setTimeout(() => {
          if (!serverInited) {
            clearInterval(serverInterval);
            resolve(serverReady);
          }
        }, 75);
      }
    }
  });
};

// shutdown the everything
const killServer = async () => {
  try {
    await Promise.all([
      coreServer?.close(),
      closeDbConnection(),
      closeRedisConnection(),
      killGrpcServer(),
    ]);
  } catch (e) {
    console.error("failed to shutdown server", e);
  }
};

export { coreServer, isReady, killServer, initServer, startServer };
