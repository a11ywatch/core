import { q } from "./handle";
import { crawlPage } from "@app/core/actions";

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

/*
 * Send request for crawl queue - Sends an email follow up on the crawl data
 * @return Promise<Websites | Pages>
 */
export const crawlMultiSite = async (data) => {
  const { pages = [], userId } = data;
  let responseData = [];

  // get users for crawl job matching the urls
  for (const url of pages) {
    let scanResult;
    try {
      scanResult = await crawlPage({ url, userId }, false);
    } catch (e) {
      console.error(e);
    }
    if (scanResult?.data) {
      responseData.push(scanResult.data);
    }
  }

  return responseData;
};
