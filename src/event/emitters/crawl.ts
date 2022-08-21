import { EventEmitter } from "events";

// crawl emitter
class CrawlEmitter extends EventEmitter {}

const crawlEmitter = new CrawlEmitter(); // active crawl event handling
const crawlTrackingEmitter = new CrawlEmitter(); // crawl active tracking

crawlEmitter.setMaxListeners(0);
crawlTrackingEmitter.setMaxListeners(0);

export { crawlTrackingEmitter, crawlEmitter };
