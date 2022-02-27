const fetch = require("node-fetch");
const { initUrl } = require("@a11ywatch/website-source-builder");

process.on("message", async ({ urlMap, userId, scan = false }) => {
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
  } finally {
    if (process.send) {
      process.send("close");
    }
  }
});
