import { EventEmitter } from "events";

// crawl emiiter for data
class CrawlEmitter extends EventEmitter {}

export const crawlEmitter = new CrawlEmitter();

export const crawlTrackingEmitter = new CrawlEmitter();
