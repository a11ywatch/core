import { getActiveUsersCrawling } from "@app/core/utils/query";
import { q, isGenerateAverageMethod } from "./handle";
import { parseData } from "./format";
import { crawlPage } from "@app/core/actions";

// send request for crawl queue
export const crawlPageQueue = async (queueSource) => {
  try {
    const data = parseData(queueSource);

    const { pages = [], user_id, meta } = data;

    // TODOL move out of file. Generate averagewebsite scores
    if (isGenerateAverageMethod(meta)) {
      return await q.push({
        userId: user_id,
        meta,
      });
    }

    // get users enqueed for crawl job matching the urls
    for (const url of pages) {
      // add single user crawls with users in pool
      const usersPooling = await getActiveUsersCrawling({
        userId: user_id,
        urlMap: url,
      });

      // remove mem queue
      await q.push({
        url,
        userId: user_id,
        usersPooling,
      });
    }
  } catch (e) {
    console.error(e);
  }
};

/*
 * Send request for crawl queue - Sends an email follow up on the crawl data
 * Returns the scan results for all pages
 */
export const crawlMultiSiteQueue = async (queueSource) => {
  let responseData = [];
  const { pages = [], userId } = queueSource;

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
