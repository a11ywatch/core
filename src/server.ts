/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import type { Server as HttpServer } from "http";
import type { AddressInfo } from "net";
import express, { Request, Response } from "express";
import http from "http";
import cors from "cors";
import createIframe from "node-iframe";
import { setConfig as setLogConfig } from "@a11ywatch/log";
import { CronJob } from "cron";
import { corsOptions, config, logServerInit, whitelist } from "./config";
import { forkProcess } from "./core/utils";
import { websiteWatch } from "./core/controllers/websites";
import { verifyUser } from "./core/controllers/users/update";
import { AnnouncementsController } from "./core/controllers/announcements";
import ua from "universal-analytics";

import {
  CRAWL_WEBSITE,
  CONFIRM_EMAIL,
  IMAGE_CHECK,
  SCAN_WEBSITE_ASYNC,
  ROOT,
  WEBSITE_CRAWL,
  WEBSITE_CHECK,
  UNSUBSCRIBE_EMAILS,
  GET_WEBSITES_DAILY,
} from "./core/routes";
import { initDbConnection, closeDbConnection } from "./database";
import { Server } from "./apollo-server";
import {
  confirmEmail,
  crawlWebsite,
  detectImage,
  root,
  unSubEmails,
  scanWebsite,
  websiteCrawl,
  websiteCrawlAuthed,
  getWebsite,
  getDailyWebsites,
} from "./rest/routes";
import { createUser } from "./core/controllers/users/set";

try {
  setLogConfig({ container: "api" });
} catch (e) {
  console.error(["logger enable error:", e]);
}

const { GRAPHQL_PORT } = config;

interface AppResponse extends Response {
  createIframe: (params: { url: string; baseHref: boolean }) => string;
}

function initServer(): HttpServer {
  const server = new Server();
  const app = express();

  app.use(cors(corsOptions));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json({ limit: "300mb" }));
  app.use(createIframe);
  app.options(CONFIRM_EMAIL, cors());
  app.options(WEBSITE_CHECK, cors());
  app.set("trust proxy", true);
  app.get(ROOT, root);
  app.get("/iframe", (req: Request, res: AppResponse) => {
    let url = req.query.url + "";
    try {
      if (url) {
        if (!url.includes("http")) {
          url = `http://${url}`;
        }

        if (req.protocol === "https") {
          url = url.replace("http:", "https:");
        }

        if (url.includes(".pdf")) {
          res.redirect(url);
        } else {
          res.createIframe({
            url,
            baseHref: !!req.query.baseHref,
          });
        }
      } else {
        res.createIframe({
          url,
          baseHref: !!req.query.baseHref,
        });
      }
    } catch (e) {
      console.error(e);
      res.createIframe({
        url,
        baseHref: !!req.query.baseHref,
      });
    }
  });
  app.get("/api/get-website", cors(), getWebsite);
  app.get(GET_WEBSITES_DAILY, getDailyWebsites);
  app.get(UNSUBSCRIBE_EMAILS, cors(), unSubEmails);
  app.post(WEBSITE_CRAWL, cors(), websiteCrawl);
  app.post(`${WEBSITE_CRAWL}-background`, async (req, res) => {
    try {
      if (
        typeof process.env.BACKGROUND_CRAWL !== "undefined" &&
        process.env.BACKGROUND_CRAWL === "enabled"
      ) {
        forkProcess({ req: { body: req.body, pubsub: true } }, "crawl-website");
        res.json(true);
      } else {
        await websiteCrawl(req, res);
      }
    } catch (e) {
      console.error(e);
    }
  });
  app.post(CRAWL_WEBSITE, cors(), crawlWebsite);
  app.post(SCAN_WEBSITE_ASYNC, cors(), scanWebsite);
  app.post(IMAGE_CHECK, cors(), detectImage);
  app.route(WEBSITE_CHECK).get(websiteCrawlAuthed).post(websiteCrawlAuthed);
  app.route(CONFIRM_EMAIL).get(cors(), confirmEmail).post(cors(), confirmEmail);

  app.post("/api/register", cors(), async (req, res) => {
    const { email, password, googleId } = req.body;
    try {
      const auth = await createUser({ email, password, googleId });
      res.json(auth);
    } catch (e) {
      console.error(e);
      res.json({
        data: null,
        message: e?.message,
      });
    }
  });

  app.get("/api/whats-new", cors(), async (_, res) => {
    try {
      const [announcements] = await AnnouncementsController().getAnnouncement(
        { _id: null },
        true
      );

      res.json({
        data: announcements ?? null,
        message: process.env.WHATS_NEW ?? "No new announcements",
      });
    } catch (e) {
      console.error(e);
      res.json({
        data: null,
        message: e?.message ?? "An Issue occured with annountments",
      });
    }
  });

  app.post("/api/login", cors(), async (req, res) => {
    const { email, password, googleId } = req.body;
    try {
      const auth = await verifyUser({ email, password, googleId });
      res.json(auth);
    } catch (e) {
      console.error(e);
      res.json({
        data: null,
        message: e?.message,
      });
    }
  });

  /* START OF CDN */
  // TODO: CDN API ROUTES
  /* EOD CDN ROUTES */

  /*  ANALYTICS */
  app.post("/api/log/page", cors(), async (req: any, res) => {
    const { page, ip, userID, screenResolution } = req.body;
    try {
      let origin = req.get("origin");

      if (origin && origin.includes("api.")) {
        origin = origin.replace("api.", "");
      }

      res.header(
        "Access-Control-Allow-Origin",
        origin ?? "https://a11ywatch.com"
      );

      if (!whitelist.includes(origin)) {
        // silent
        res.sendStatus(200);
        return;
      }

      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
      );

      const locationIP = ip ?? req.ip ?? req.connection.remoteAddress;
      const id = userID ?? locationIP;

      const visitor = ua(process.env.GOOGLE_ANALYTIC_ID, id, {
        cid: process.env.GOOGLE_CLIENT_ID,
        uid: id,
        strictCidFormat: false,
      });

      if (req.headers["DNT"] !== "1") {
        // TODO: any data future collection
      }

      visitor.set("uip", locationIP);

      if (screenResolution) {
        visitor.set("vp", Number(screenResolution));
      }

      visitor.set("ua", req.headers["user-agent"]);

      visitor.pageview(page ?? "/", origin).send();

      res.sendStatus(204);
    } catch (e) {
      console.error(e);
      res.sendStatus(200);
    }
  });
  /*  END OF ANALYTICS */

  // INTERNAL
  app.get("/_internal_/healthcheck", cors(), async (_, res) => {
    res.json({
      status: "healthy",
    });
  });

  //An error handling middleware
  app.use(function (err, _req, res, next) {
    if (res.headersSent) {
      return next(err);
    }
    res.status(500);
    res.render("error", { error: err });
  });

  server.applyMiddleware({ app, cors: false });

  const httpServer = http.createServer(app);

  server.installSubscriptionHandlers(httpServer);

  const listener = httpServer.listen(GRAPHQL_PORT);

  logServerInit((listener.address() as AddressInfo).port, {
    subscriptionsPath: server.subscriptionsPath,
    graphqlPath: server.graphqlPath,
  });

  if (process.env.DYNO === "web.1" || !process.env.DYNO) {
    new CronJob("00 00 00 * * *", websiteWatch).start();
  }

  return listener;
}

const coreServer = (() => {
  try {
    (async function startDb() {
      await initDbConnection();
    })();
    return initServer();
  } catch (e) {
    console.error("SERVER FAILED TO START");
    console.error(e);
  }
})();

const killServer = async () => {
  try {
    await Promise.all([closeDbConnection(), coreServer?.close()]);
  } catch (e) {
    console.error("failed to kill server", e);
  }
};

export { initServer, killServer };
export default coreServer;
