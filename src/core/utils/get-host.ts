import { URL } from "url";

export const getHostName = (url: string) => {
  const { hostname } = new URL(url);

  return hostname.replace(/^[^.]+\./g, "");
};
