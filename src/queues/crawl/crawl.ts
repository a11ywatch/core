import { crawlingSet, getKey } from "../../event/crawl-tracking";
import { q } from "./handle";

/*
 * Send request for crawl to memory queue. [todo: send domain from crawler to avoid hostname parsing per url]
 * @return Promise<void>
 */
export const crawlEnqueue = async (data: {
  pages: string[];
  user_id: number;
  html?: string;
}) => {
  const { pages = [], user_id, html } = data;
  const key = getKey(null, pages, user_id);

  const event = crawlingSet.has(key) && crawlingSet.get(key).event;

  // get users for crawl job matching the urls
  for (const url of pages) {
    if (event) {
      await event.unshift({
        url,
        userId: user_id,
        html,
      });
    } else {
      await q.unshift({
        url,
        userId: user_id,
        html,
      });
    }
  }
};
