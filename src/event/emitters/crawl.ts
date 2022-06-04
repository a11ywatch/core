import { EventEmitter } from "events";

// crawl emiiter for data
class CrawlEmitter extends EventEmitter {}

const crawlEmitter = new CrawlEmitter();

const crawlTrackingEmitter = new CrawlEmitter();

crawlEmitter.setMaxListeners(0);
crawlTrackingEmitter.setMaxListeners(0);

export { crawlTrackingEmitter, crawlEmitter };
