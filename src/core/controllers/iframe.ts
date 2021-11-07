import { Request } from "express";
import type { AppResponse } from "../../server-types";

const createIframe = (req: Request, res: AppResponse) => {
  let url = req.query.url + "";

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
};

export { createIframe };
