import { initUrl } from "@a11ywatch/website-source-builder";
import { fetchFrame } from "node-iframe";

/*
 * Create an iframe based off a url and reverse engineer the content for CORS.
 * Uses node-iframe package to handle iframes.
 */
const createIframe = async (req, res) => {
  try {
    const baseUrl = req.query.url || req.query.websiteUrl;

    if (!baseUrl) {
      return res.send(false);
    }

    const url = initUrl(decodeURIComponent(baseUrl));

    if (url.includes(".pdf")) {
      res.redirect(url);
    }

    const frame = await fetchFrame({
      url,
      baseHref: !!req.query.baseHref,
    });

    res.type("text/html").send(frame);
  } catch (e) {
    console.error(e);
    res.send(false);
  }
};

export { createIframe };
