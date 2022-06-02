import { q } from "./handle";

/*
 * Send request for crawl to memory queue.
 * @return Promise<void>
 */
export const crawlEnqueue = async (data) => {
  const { pages = [], user_id } = data;

  // get users for crawl job matching the urls
  for (const url of pages) {
    try {
      await q.push({
        url,
        userId: user_id,
      });
    } catch (e) {
      console.error(e);
    }
  }
};
