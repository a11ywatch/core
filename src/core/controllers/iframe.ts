import { Request } from "express";
import type { AppResponse } from "@app/types/types";
import { initUrl } from "@a11ywatch/website-source-builder";

const createIframe = (req: Request, res: AppResponse) => {
  const origin = req.get("origin");

  res.set("Access-Control-Allow-Origin", origin);
  res.setHeader("Content-Type", "text/html");

  try {
    const baseUrl = String(req.query.url || req.query.websiteUrl);

    if (!baseUrl) {
      return res.send(false);
    }

    const url = initUrl(decodeURIComponent(baseUrl));

    if (url.includes(".pdf")) {
      res.redirect(url);
    }

    res.createIframe({
      url,
      baseHref: !!req.query.baseHref,
    });
  } catch (e) {
    console.error(e);
    res.send(false);
  }
};

export { createIframe };
