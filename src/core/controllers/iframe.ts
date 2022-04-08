import { Request } from "express";
import type { AppResponse } from "@app/types";

const createIframe = (req: Request, res: AppResponse) => {
  try {
    const baseUrl = String(req.query.url || req.query.websiteUrl);

    if (!baseUrl) {
      return res.send(false);
    }

    let url = decodeURIComponent(baseUrl);

    if (!url.includes("http")) {
      url = `http://${url}`;
    }

    if (req.protocol === "https") {
      url = url.replace("http:", "https:");
    }

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
