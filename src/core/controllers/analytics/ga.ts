import type { Request, Response } from "express";
import { config, whitelist } from "@app/config";
import ua from "universal-analytics";

const { DEV, DOMAIN } = config;

// get the origin of the request
const getOrigin = (origin: string, nextJSMiddleware?: boolean) => {
  if (origin && origin.includes("api.")) {
    return origin.replace("api.", "");
  }

  if (nextJSMiddleware) {
    return DOMAIN;
  }

  return origin || DOMAIN;
};

// log a page to GA
export const logPage = async (req: Request, res: Response) => {
  // prevent dev or non ga logging
  if (!process.env.GOOGLE_ANALYTIC_ID || DEV) {
    return res.sendStatus(200);
  }

  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, X-Forwarded-For, X-Forwarded-Path, X-Forwarded-ID, Content-Type, Cookies, Accept, User-Agent, Referer, DNT"
  );
  const agent = req.headers["user-agent"];
  const middleware = agent === "Next.js Middleware";

  const origin = getOrigin(
    req.get("origin") || req.headers.origin,
    agent === "Next.js Middleware"
  );

  // IGNORE OPTIONS prevent outside domains
  if (!whitelist.includes(origin)) {
    return res.sendStatus(200);
  }

  const ip = req.headers["x-forwarded-for"] || req.ip;
  const dr = req.headers["referer"];
  const userID = req.headers["x-forwarded-id"] as any;
  const page = req.headers["x-forwarded-path"] as any;

  try {
    const visitor = ua(process.env.GOOGLE_ANALYTIC_ID, {
      cid: origin,
      uid: userID,
      strictCidFormat: false,
    });

    if (req.headers["DNT"] !== "1") {
      // TODO: any data future collection convert to OSS analytics
    }

    visitor.set("uip", ip);

    // if (screenResolution) {
    //   visitor.set("vp", Number(screenResolution));
    // }

    if (dr) {
      visitor.set("dr", encodeURI(dr + ""));
    }

    if (!middleware && agent) {
      visitor.set("ua", encodeURI(agent + ""));
    }

    visitor.pageview(page ?? "/", origin).send();

    res.sendStatus(204);
  } catch (e) {
    console.error(e);
    res.sendStatus(200);
  }
};
