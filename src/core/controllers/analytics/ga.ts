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

// log a page to GA without sending any tracking info
export const logPage = async (req: Request, res: Response) => {
  // prevent dev or non ga logging
  if (!process.env.GOOGLE_ANALYTIC_ID || DEV) {
    return res.sendStatus(200);
  }

  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, X-Forwarded-For, X-Forwarded-Path, X-Forwarded-ID, Content-Type, Cookies, Accept, User-Agent, Referer, DNT"
  );
  const agent = req.get("User-Agent");

  const origin = getOrigin(req.get("Origin"), agent === "Next.js Middleware");

  // IGNORE OPTIONS prevent outside domains
  if (!whitelist.includes(origin)) {
    return res.sendStatus(200);
  }

  const ip = req.get("X-Forwarded-For");
  const dr = req.get("Referer");
  const userID = req.get("X-Forwarded-ID");

  try {
    const visitor = ua(process.env.GOOGLE_ANALYTIC_ID, origin, {
      cid: origin,
      uid: userID || ip,
      strictCidFormat: false,
      headers: {
        "X-Forwarded-For": ip,
        "User-Agent": agent,
        Referer: encodeURI(dr),
      },
    });

    visitor.pageview(req.get("X-Forwarded-Path") || "/", origin).send();
  } catch (e) {
    console.error(e);
  }

  res.sendStatus(204);
};
