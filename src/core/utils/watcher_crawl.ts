import fetch from "node-fetch";
import { initUrl } from "@a11ywatch/website-source-builder";

export const watcherCrawl = async ({ urlMap, userId, scan = false }) => {
  const url = String(initUrl(urlMap, true));
  const targetUrl = scan ? "scan" : "crawl";

  try {
    await fetch(`${process.env.WATCHER_CLIENT_URL}/${targetUrl}`, {
      method: "POST",
      body: JSON.stringify({
        url,
        id: userId,
      }),
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
  }
};
