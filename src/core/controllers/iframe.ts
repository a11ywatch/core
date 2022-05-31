import { Request } from "express";
import type { AppResponse } from "@app/types";
import { initUrl } from "@a11ywatch/website-source-builder";

const createIframe = (req: Request, res: AppResponse) => {
  try {
    const baseUrl = String(req.query.url || req.query.websiteUrl);

    if (!baseUrl) {
      return res.send(false);
    }

    const url = initUrl(decodeURIComponent(baseUrl));
    // TODO: REMOVE replace

    if (url.includes(".pdf")) {
      res.redirect(url);
    }

    res.createIframe({
      url,
      baseHref: !!req.query.baseHref,
    });
  } catch (e) {
    console.error(e);
  }
};

export { createIframe };
