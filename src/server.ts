/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import type { Server as HttpServer } from "http";
import type { AddressInfo } from "net";
import express from "express";
import http from "http";
import cors from "cors";
import createIframe from "node-iframe";
import { setConfig as setLogConfig } from "@a11ywatch/log";
import { CronJob } from "cron";
import { corsOptions, config, logServerInit, whitelist } from "./config";
import { forkProcess } from "./core/utils";
import { websiteWatch } from "./core/controllers/websites";
import { verifyUser } from "./core/controllers/users/update";
import { createIframe as createIframeEvent } from "./core/controllers/iframe";
import { AnnouncementsController } from "./core/controllers/announcements";
import ua from "universal-analytics";
import fetcher from "node-fetch";

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
  ADD_SCRIPT,
  ADD_SCREENSHOT,
  DOWNLOAD_SCRIPT,
  GET_SCRIPT,
  GET_SCREENSHOT,
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

setLogConfig({
  container: "api",
  disabled: process.env.LOGGER_ENABLED === "true" ? false : true,
});

const { GRAPHQL_PORT, DEV } = config;

async function initServer(): Promise<HttpServer> {
  // TODO: REMOVE DB CONNECTION TOP LEVEL
  await initDbConnection();

  const app = express();

  app.use(cors(corsOptions));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json({ limit: "300mb" }));
  app.use(createIframe);
  app.options(CONFIRM_EMAIL, cors());
  app.options(WEBSITE_CHECK, cors());
  app.set("trust proxy", true);
  app.get(ROOT, root);
  app.get("/iframe", createIframeEvent);
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

  // CDN SERVER TODO
  app.get(GET_SCRIPT, async (req, res) => {
    try {
      const request = await fetcher(
        `${String(process.env.SCRIPTS_CDN_URL).replace("api", "cdn")}/${
          req.params.domain
        }/${req.params.cdnPath}`,
        {
          method: "GET",
        }
      );
      const data = await request.text();

      return res.send(data);
    } catch (error) {
      console.error(error);
    }
  });
  app.get(GET_SCREENSHOT, async (req, res) => {
    try {
      const request = await fetcher(
        `${String(process.env.SCRIPTS_CDN_URL).replace("api", "screenshots")}/${
          req.params.domain
        }/${req.params.cdnPath}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await request.text();

      return res.send(data);
    } catch (error) {
      console.error(error);
    }
  });
  app.get(DOWNLOAD_SCRIPT, async (req, res) => {
    try {
      const request = await fetcher(
        `${String(process.env.SCRIPTS_CDN_URL).replace("api", "download")}/${
          req.params.domain
        }/${req.params.cdnPath}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await request.text();

      return res.send(data);
    } catch (error) {
      console.error(error);
    }
  });
  app.post(ADD_SCRIPT, async (req, res) => {
    try {
      const request = await fetcher(
        `${process.env.SCRIPTS_CDN_URL}/add-script`,
        {
          method: "POST",
          body: req.body ? JSON.stringify(req.body) : null,
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await request.text();

      return res.send(data);
    } catch (error) {
      console.error(error);
    }
  });
  app.post(ADD_SCREENSHOT, async (req, res) => {
    try {
      const request = await fetcher(
        `${process.env.SCRIPTS_CDN_URL}/add-screenshot`,
        {
          method: "POST",
          body: req.body ? JSON.stringify(req.body) : null,
          headers: { "Content-Type": "application/json" },
        }
      );
      const data = await request.text();

      return res.send(data);
    } catch (e) {
      console.error(e);
    }
  });

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

  app.post("/api/run-watcher", cors(), async (req, res) => {
    const { password } = req.body;
    try {
      if (password === process.env.ADMIN_PASSWORD) {
        await websiteWatch();
      } else {
        console.error("admin password required");
      }
      res.json(true);
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
        message: e?.message ?? "An Issue occured with announcements",
      });
    }
  });

  /* START OF CDN */
  // TODO: CDN API ROUTES
  /* EOD CDN ROUTES */

  /*  ANALYTICS */
  app.post("/api/log/page", cors(), async (req, res) => {
    let origin = req.get("origin") || req.headers.origin;
    const nextJSMiddleware = req.headers["user-agent"] === "Next.js Middleware";

    // // DO NOT LOG IN DEV
    if (DEV) {
      res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
      );
      res.header(
        "Access-Control-Allow-Origin",
        origin ?? "https://a11ywatch.com"
      );

      return res.sendStatus(200);
    }

    const { page, ip, userID, screenResolution, documentReferrer } = req.body;

    try {
      if (origin && origin.includes("api.")) {
        origin = origin.replace("api.", "");
      }

      if (!origin && nextJSMiddleware) {
        origin = "https://a11ywatch.com";
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
      const uid = userID ?? locationIP;

      const visitor = ua(process.env.GOOGLE_ANALYTIC_ID, uid, {
        cid: process.env.GOOGLE_CLIENT_ID,
        uid,
        strictCidFormat: false,
      });

      if (req.headers["DNT"] !== "1") {
        // TODO: any data future collection
      }

      visitor.set("uip", locationIP);

      if (screenResolution) {
        visitor.set("vp", Number(screenResolution));
      }
      const dr = documentReferrer ?? req.headers["referer"];

      if (dr) {
        visitor.set("dr", dr);
      }

      if (req.headers["user-agent"]) {
        visitor.set("ua", req.headers["user-agent"]);
      }

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

  const server = new Server();

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

let coreServer: HttpServer;

const killServer = async () => {
  try {
    await Promise.all([closeDbConnection(), coreServer.close()]);
  } catch (e) {
    console.error("failed to kill server", e);
  }
};

(async () => {
  try {
    coreServer = await initServer();
  } catch (e) {
    console.error(["SERVER FAILED TO START", e]);
  }
})();

export { killServer, initServer };
export default coreServer;
