/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import type { Request, Response } from "express";
import { config, whitelist } from "@app/config";
import ua from "universal-analytics";

const { DEV, DOMAIN } = config;

const getOrigin = (origin: string, nextJSMiddleware?: boolean) => {
  if (origin && origin.includes("api.")) {
    return origin.replace("api.", "");
  }

  if (nextJSMiddleware) {
    return DOMAIN;
  }

  return origin || DOMAIN;
};

export const logPage = async (req: Request, res: Response) => {
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Cookies, Accept, User-Agent, Referer, DNT"
  );
  const agent = req.headers["user-agent"];
  const middleware = agent === "Next.js Middleware";

  const origin = getOrigin(
    req.get("origin") || req.headers.origin,
    agent === "Next.js Middleware"
  );

  // // IGNORE OPTIONS
  if (DEV || !whitelist.includes(origin)) {
    return res.sendStatus(200);
  }

  const rawCookie = req.headers["cookies"];
  const cookies = rawCookie && JSON.parse(rawCookie as string);

  const {
    page,
    ip,
    userID,
    _ga,
    screenResolution,
    documentReferrer,
    geo,
  } = req.body;

  console.log(req.body);

  try {
    const uip = ip || req.ip || req.connection.remoteAddress;
    const uid = userID ?? uip;
    const dr = documentReferrer ?? req.headers["referer"];
    const cid =
      _ga || (cookies && cookies["_ga"]) || process.env.GOOGLE_CLIENT_ID;

    const visitor = ua(process.env.GOOGLE_ANALYTIC_ID, uid, {
      cid,
      uid,
      strictCidFormat: false,
    });

    if (req.headers["DNT"] !== "1") {
      // TODO: any data future collection
    }

    if (ip) {
      visitor.set("uip", ip);
    } else if (geo) {
      const { country } = geo;

      if (country) {
        visitor.set("geoid", country);
      }
    }

    if (screenResolution) {
      visitor.set("vp", Number(screenResolution));
    }

    if (dr) {
      visitor.set("dr", dr);
    }

    if (!middleware && agent) {
      visitor.set("ua", encodeURIComponent(agent));
    }

    visitor.pageview(page ?? "/", origin).send();

    res.sendStatus(204);
  } catch (e) {
    console.error(e);
    res.sendStatus(200);
  }
};
