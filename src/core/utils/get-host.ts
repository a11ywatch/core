import { URL } from "url";

export const getHostName = (url: string) => {
  try {
    const { hostname } = new URL(url);

    return hostname.replace(/^[^.]+\./g, "");
  } catch (e) {
    console.error(e);
  }
};
