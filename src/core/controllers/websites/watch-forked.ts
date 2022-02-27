import { initDbConnection } from "@app/database";
import { websiteWatch } from "./watch-pages";

process.on("message", async ({ pages }) => {
  try {
    await initDbConnection();
    await websiteWatch(pages);
  } catch (e) {
    console.error(e);
  } finally {
    process.send("close");
  }
});
