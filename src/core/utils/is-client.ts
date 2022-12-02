import { config, SUPER_MODE } from "../../config/config";

const containsTrailing = (url: string) => url && url[url.length - 1] === "/";

const DOMAIN = containsTrailing(config.DOMAIN)
  ? config.DOMAIN.slice(0, -1)
  : config.DOMAIN;

const bypassall = SUPER_MODE || config.DEV;

const DOMAINT = DOMAIN.replace(/^https?:\/\//, '');

// determine if the path is the front-end client for the hast - default to false
export const frontendClientOrigin = (origin: string) => {
  if (origin) {
    if (bypassall) {
      return origin.includes("localhost") || origin.includes("127.0.0.1");
    }
    return origin.startsWith(DOMAINT) || origin.startsWith(DOMAIN);
  }
  return bypassall;
};
