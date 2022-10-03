import { config, SUPER_MODE } from "../../config/config";

const containsTrailing = (url: string) => url && url[url.length - 1] === "/";

const CLIENT_URL = containsTrailing(config.CLIENT_URL)
  ? config.CLIENT_URL.slice(0, -1)
  : config.CLIENT_URL;
const DOMAIN = containsTrailing(config.DOMAIN)
  ? config.DOMAIN.slice(0, -1)
  : config.DOMAIN;

const CLIENT_URL_T = CLIENT_URL ? `${CLIENT_URL}/` : CLIENT_URL;
const DOMAIN_T = DOMAIN ? `${DOMAIN}/` : DOMAIN;

// determine if the path is the front-end client for the hast
export const frontendClientOrigin = (origin: string) => {
  if (SUPER_MODE || config.DEV) {
    return origin?.includes("localhost") || origin?.includes("127.0.0.1");
  }

  if (containsTrailing(origin)) {
    return origin === CLIENT_URL_T || origin === DOMAIN_T;
  } else {
    return origin === CLIENT_URL || origin === DOMAIN;
  }
};
