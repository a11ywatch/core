import { URL } from "url";

// remove this for website-builder package
export const getHostName = (url: string) => {
  if (!url) {
    return "";
  }
  let q = decodeURIComponent(url);
  try {
    if (!/^(http|https)/.test(q)) {
      if (q.startsWith("://")) {
        q = `https${q}`;
      } else {
        q = `https://${q}`;
      }
    }

    const { hostname } = new URL(q);

    return hostname;
  } catch (e) {
    console.error(`invalid url ${q} \n ${e}`);
  }
};
