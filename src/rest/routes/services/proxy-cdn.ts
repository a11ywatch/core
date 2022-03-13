import url from "url";
import proxy from "express-http-proxy";

// move to cdn env var
export const cdnProxy = proxy("http://cdn-server:8090", {
  proxyReqPathResolver: (req) => {
    const path = url.parse(req.originalUrl).path;

    // remove target path since production uses another cdn
    if (!process.env.PROXY_PRESERVE_CDN) {
      return path.replace("/cdn", "");
    }

    return path;
  },
});
