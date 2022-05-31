import { q } from "./handle";

/*
 * Send request for crawl to memory queue.
 * @return Promise<void>
 */
export const crawlEnqueue = async (data) => {
  try {
    const { pages = [], user_id } = data;

    // get users enqueed for crawl job matching the urls
    for (const url of pages) {
      // remove mem queue
      await q.push({
        url,
        userId: user_id,
        usersPooling: [], // TODO: remove from config
      });
    }
  } catch (e) {
    console.error(e);
  }
};
