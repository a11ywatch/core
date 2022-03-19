import { WEBSITE_CRAWL } from "@app/core/routes";
import { Application } from "express";
import { completeCrawlTracker, startCrawlTracker } from "../routes/services";

export const setCrawlManagerRoutes = (app: Application) => {
  app.post(`${WEBSITE_CRAWL}-start`, startCrawlTracker);
  app.post(`${WEBSITE_CRAWL}-complete`, completeCrawlTracker);
  app.post(`${WEBSITE_CRAWL}-background-start`, startCrawlTracker);
  app.post(`${WEBSITE_CRAWL}-background-complete`, completeCrawlTracker);
};
