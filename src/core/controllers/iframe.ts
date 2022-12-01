import { initUrl } from "@a11ywatch/website-source-builder";
import { fetchFrame } from "node-iframe";
import type { FastifyContext } from "apollo-server-fastify";
import { allowedNext } from "../utils/get-user-data";

/*
 * Create an iframe based off a url and reverse engineer the content for CORS.
 * Uses node-iframe package to handle iframes.
 */
const createIframe = async (
  req: FastifyContext["request"],
  res: FastifyContext["reply"]
) => {
  const baseUrl = req.query["url"] || req.query["websiteUrl"];

  if (!baseUrl || !req.headers["user-agent"]) {
    return res.send(false);
  }

  const url = initUrl(decodeURIComponent(baseUrl));

  if (url.includes(".pdf")) {
    return res.redirect(url);
  }

  const allowed = await allowedNext(
    req?.headers?.authorization || req.cookies.jwt,
    req,
    res,
    "html"
  );

  if (allowed) {
    try {
      const frame = await fetchFrame({
        url,
        baseHref: !!req.query["baseHref"],
        retry: 2
      });

      res.type("text/html").send(frame);
    } catch (e) {
      console.error(e);
      res.send(false);
    }
  }
};

export { createIframe };
