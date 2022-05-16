import { config } from "@app/config";
import { SUPER_MODE } from "@app/config/config";

// determine if the path is the front-end client for the hast
export const frontendClientOrigin = (origin: string) => {
  if (SUPER_MODE || config.DEV) {
    return origin?.includes("localhost") || origin?.includes("127.0.0.1");
  }
  return origin === config.CLIENT_URL || origin === config.DOMAIN;
};
