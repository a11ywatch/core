import { URL } from "url";

// remove this for website-builder package
export const getHostName = (url: string) => {
  if (!url) {
    return "";
  }
  try {
    let q = decodeURIComponent(url);
    if (!/^(http|https)/.test(q)) {
      if (q.startsWith("://")) {
        q = `https${q}`;
      } else {
        q = `https://${q}`;
      }
    }

    const { hostname } = new URL(url);

    return hostname;
  } catch (e) {
    console.error(`invalid url ${url} \n ${e}`);
  }
};
