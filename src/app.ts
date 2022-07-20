import type { Server as HttpServer } from "http";
import type { AddressInfo } from "net";
import express, { Request, Response } from "express";
import http from "http";
import https from "https";
import cors from "cors";
import createIframe, { configureAgent } from "node-iframe";
import { CronJob } from "cron";
import {
  corsOptions,
  config,
  logServerInit,
  PRIVATE_KEY,
  PUBLIC_KEY,
  whitelist,
} from "./config";
import {
  addWebsite,
  crawlAllAuthedWebsitesCluster,
} from "./core/controllers/websites";
import { createIframe as createIframeEvent } from "./core/controllers/iframe";
import cookieParser from "cookie-parser";
import { getBaseParams, paramParser } from "./rest/extracter";
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
import { confirmEmail, detectImage, root, unSubEmails } from "./rest/routes";
import { logPage } from "./core/controllers/analytics/ga";
import { statusBadge } from "./rest/routes/resources/badge";
import { scanSimple } from "./rest/routes/scan";
import { setGithubActionRoutes } from "./rest/routes_groups/github-actions";
import { setAnnouncementsRoutes } from "./rest/routes_groups/announcements";
import { setAuthRoutes } from "./rest/routes_groups/auth";
import { limiter, scanLimiter, connectLimiters } from "./rest/limiters/scan";
import { startGRPC } from "./proto/init";
import { killServer as killGrpcServer } from "./proto/website-server";
import { getUserFromToken, parseCookie } from "./core/utils";
import { retreiveUserByToken } from "./core/utils/get-user-data";
import { responseModel } from "./core/models";
import { ApolloServer } from "apollo-server-express";
import { getWebsiteAPI, getWebsiteReport } from "./rest/routes/data/website";
import { getWebsite } from "@app/core/controllers/websites";
import { AnalyticsController } from "./core/controllers";
import { crawlStream } from "./core/streams/crawl";
import { crawlRest } from "./rest/routes/crawl";
import { getWebsitesPaging } from "./core/controllers/websites/find/get";
import { getIssuesPaging } from "./core/controllers/issues/find";
import { getServerConfig } from "./apollo-server";
import { establishCrawlTracking } from "./event";
import { getPagesPaging } from "./core/controllers/pages/find/domains";
import { updateWebsite } from "./core/controllers/websites/update";
import { getAnalyticsPaging } from "./core/controllers/analytics";
import { graphqlPlayground } from "./html";
import { SubscriptionServer } from "subscriptions-transport-ws";
import { getScriptsPaging } from "./core/controllers/scripts";
import { execute, subscribe } from "graphql";
import path from "path";
import {
  getPageSpeedPaging,
  PageSpeedController,
} from "./core/controllers/page-speed/main";

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
    createPubSub(); //gql sub
    connectLimiters(); // rate limiters
  } catch (e) {
    console.error(e);
  }
};

const allowDocDomains = [...whitelist, "vercel.com"]; // vercel.com for getStaticProps building pages. [TODO: move files out of this system]

function initServer(): HttpServer[] {
  const app = express();

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
  app.options(CONFIRM_EMAIL, cors());
  app.options(UNSUBSCRIBE_EMAILS, cors());
  // root
  app.get(ROOT, root);

  app.get("/status/:domain", cors(), statusBadge);

  app.get("/playground", (_req, res) => {
    res.send(graphqlPlayground());
  });

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
  // retreive a user from the database.
  app.get("/api/user", cors(), async (req, res) => {
    const [data] = await retreiveUserByToken(req.headers.authorization);

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

    const { userId, domain } = getBaseParams(req);

    // flexible params for url [backwards compat api support] TODO: remove
    const url1 = paramParser(req, "url");
    const url2 = paramParser(req, "websiteUrl");
    const url3 = paramParser(req, "pageUrl");
    const urlBase = url1 || url2 || url3;
    const url = urlBase ? decodeURIComponent(urlBase + "") : undefined;

    try {
      const [page] = await getWebsite({
        userId,
        domain,
        url,
      });
      data = page;
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
    const { userId, domain, pageUrl } = getBaseParams(req);

    let data;
    let code = 200;
    let message = "";

    try {
      data = await AnalyticsController().getWebsite({
        userId,
        pageUrl: pageUrl ? pageUrl : undefined,
        domain: domain ? domain : undefined,
      });
      message = "Successfully retrieved analytic for page.";
    } catch (e) {
      code = 400;
      message = `Failed to retrieved analytic - ${e}`;
    }

    res.json(
      responseModel({
        code,
        data: data ? data : null,
        message,
      })
    );
  });

  // TODO: GET SINGLE ISSUE, SCRIPT OpenAPi

  // retreive a page analytic from the database.
  app.get("/api/pagespeed", cors(), async (req, res) => {
    const { userId, domain, pageUrl } = getBaseParams(req);

    let data;
    let code = 200;
    let message = "";

    try {
      data = await PageSpeedController().getWebsite({
        userId,
        pageUrl: pageUrl ? pageUrl : undefined,
        domain: domain ? domain : undefined,
      });
      message = "Successfully retrieved pagespeed for website.";
    } catch (e) {
      code = 400;
      message = `Failed to retrieve pagespeed - ${e}`;
    }

    res.json(
      responseModel({
        code,
        data: data ? data : null,
        message,
      })
    );
  });

  // paginated retreive websites from the database.
  app.get("/api/list/website", cors(), async (req, res) => {
    const { userId } = getBaseParams(req);
    let data;
    let code = 200;
    let message = "";

    if (typeof userId !== "undefined") {
      try {
        data = await getWebsitesPaging({
          userId,
          limit: 5,
          offset: Number(req.query.offset) || 0,
          insights: true,
        });
        message = "Successfully retrieved websites.";
      } catch (e) {
        code = 400;
        message = `Failed to retrieved websites - ${e}`;
      }
    }

    res.json(
      responseModel({
        code,
        data: data ? data : null,
        message,
      })
    );
  });

  // paginated retreive analytics from the database. Limit default is set to 20.
  app.get("/api/list/analytics", cors(), async (req, res) => {
    const { userId, domain } = getBaseParams(req);
    let data;
    let code = 200;
    let message = "";

    if (typeof userId !== "undefined") {
      try {
        data = await getAnalyticsPaging({
          userId,
          limit: 5,
          offset: Number(req.query.offset) || 0,
          domain,
        });
        message = "Successfully retrieved analytics.";
      } catch (e) {
        code = 400;
        message = `Failed to retrieved analytics - ${e}`;
      }
    }

    res.json(
      responseModel({
        code,
        data: data ? data : null,
        message,
      })
    );
  });

  // paginated retreive pages from the database.
  app.get("/api/list/pages", cors(), async (req: Request, res: Response) => {
    const { userId, domain } = getBaseParams(req);
    let data;
    let code = 200;
    let message = "";

    if (typeof userId !== "undefined") {
      try {
        data = await getPagesPaging({
          userId,
          limit: 5,
          offset: Number(req.query.offset) || 0,
          domain: domain || undefined,
          insights: true,
        });
        if (data) {
          message = "Successfully retrieved pages.";
        }
      } catch (e) {
        code = 400;
        message = `Failed to retrieved pages - ${e}`;
      }
    }

    res.json(
      responseModel({
        code,
        data: data ? data : null,
        message,
      })
    );
  });

  // paginated retreive scripts from the database. Limit default is set to 20.
  app.get("/api/list/scripts", cors(), async (req: Request, res: Response) => {
    const { userId, domain } = getBaseParams(req);

    let data;
    let code = 200;
    let message = "";

    if (typeof userId !== "undefined") {
      try {
        data = await getScriptsPaging({
          userId,
          limit: 5,
          offset: Number(req.query.offset) || 0,
          domain,
        });
        message = "Successfully retrieved scripts.";
      } catch (e) {
        code = 400;
        message = `Failed to retrieved scripts - ${e}`;
      }
    }

    res.json(
      responseModel({
        code,
        data: data ? data : null,
        message,
      })
    );
  });

  // list of issues
  app.get("/api/list/issue", cors(), async (req: Request, res: Response) => {
    const { userId, domain, pageUrl } = getBaseParams(req);

    let data;
    let code = 200;
    let message = "";

    if (typeof userId !== "undefined") {
      try {
        data = await getIssuesPaging({
          userId,
          limit: 5,
          domain,
          pageUrl,
        });
        message = "Successfully retrieved issues.";
      } catch (e) {
        code = 400;
        message = `Failed to retrieve issues - ${e}`;
      }
    }

    res.json(
      responseModel({
        code,
        data: data ? data : null,
        message,
      })
    );
  });

  // list of pagespeed collections
  app.get(
    "/api/list/pagespeed",
    cors(),
    async (req: Request, res: Response) => {
      const { userId, domain, pageUrl } = getBaseParams(req);

      let data;
      let code = 200;
      let message = "";

      if (typeof userId !== "undefined") {
        try {
          data = await getPageSpeedPaging({
            userId,
            limit: 5,
            domain,
            pageUrl,
            all: false,
          });
          message = "Successfully retrieved pagespeed.";
        } catch (e) {
          code = 400;
          message = `Failed to retrieve pagespeed - ${e}`;
        }
      }

      res.json(
        responseModel({
          code,
          data: data ? data : null,
          message,
        })
      );
    }
  );

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
      message:
        "This endpoint is a WIP. It will be used to update your website configuration",
    });
  });

  /*
   * Add website.
   * This sets the website configuration for crawling like user agents, headers, and etc.
   */
  app.post("/api/website", cors(), async (req, res) => {
    const usr = getUserFromToken(req.headers.authorization);
    const userId = usr?.payload?.keyid;

    if (typeof userId === "undefined") {
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
    const robots = paramParser(req, "robots");
    const subdomains = paramParser(req, "subdomains");
    const tld = paramParser(req, "tld");

    const { website } = await addWebsite({
      userId,
      url,
      customHeaders,
      mobile,
      pageInsights,
      ua,
      standard,
      canScan: false,
      actions,
      robots,
      subdomains,
      tld,
    });

    return res.json({
      data: website,
      message:
        subdomains || tld
          ? `Website added with crawl - subdomains:${subdomains} & tld:${tld}`
          : "Website added!",
    });
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
          userId: user ? user?.payload?.keyid : undefined,
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
      subscriptionsPath: server.subscriptionsPath,
      graphqlPath: server.graphqlPath,
    });

    if (process.env.NODE_ENV !== "test") {
      // compatability with heroku dynos if deployed.
      if (process.env.DYNO === "web.1" || !process.env.DYNO) {
        new CronJob("0 11,23 * * *", crawlAllAuthedWebsitesCluster).start();
      }
    }
  });

  return [listener];
}

let coreServer: HttpServer;

const startServer = async () => {
  if (config.SUPER_MODE) {
    console.log("Application started in SUPER mode. All restrictions removed.");
  }

  // tracking event emitter
  establishCrawlTracking();

  try {
    // connect all clients gRPC
    await connectClients();
  } catch (e) {
    console.error(e);
  }

  try {
    // start the gRPC server
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

// shutdown the server
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

export { coreServer, killServer, initServer, startServer };
