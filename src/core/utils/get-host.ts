import { URL } from "url";

export const getHostName = (url: string) => {
  try {
    let q = url;
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
