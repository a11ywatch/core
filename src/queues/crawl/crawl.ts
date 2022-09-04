import { crawlingSet, getKey } from "../../event/crawl-tracking";
import { q } from "./handle";

/*
 * Send request for crawl to memory queue.
 * @return Promise<void>
 */
export const crawlEnqueue = async (data: {
  pages: string[];
  user_id: number;
}) => {
  const { pages = [], user_id } = data;
  const key = getKey(null, pages, user_id);
  const event = crawlingSet[key] && crawlingSet[key].event;

  // get users for crawl job matching the urls
  for (const url of pages) {
    if (event) {
      await event.unshift({
        url,
        userId: user_id,
      });
    } else {
      await q.unshift({
        url,
        userId: user_id,
      });
    }
  }
};
