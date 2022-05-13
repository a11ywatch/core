import { getActiveUsersCrawling } from "@app/core/utils/query";
import { Method } from "@app/database/config";
import { q } from "./handle";
import { parseData } from "./format";

interface Meta {
  method?: Method;
  extra: any;
}

// if the gRPC request was crawl complete. TODO: seperate method call
const isGenerateAverageMethod = (meta: Meta) => {
  if (meta && typeof meta?.method !== "undefined") {
    return meta.method === Method["crawl_complete"];
  }
  return false;
};

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
