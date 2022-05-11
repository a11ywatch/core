import fastq from "fastq";
import { crawlWebsite as crawl } from "@app/core/actions";
import { getActiveUsersCrawling } from "@app/core/utils/query";
import { setWebsiteScore } from "@app/core/utils/stats/score";
import { Method } from "@app/database/config";
import type { ResponseModel } from "@app/core/models/response/types";
import type { queueAsPromised } from "fastq";

interface Meta {
  method?: Method;
  extra: any;
}

type Task = {
  userId?: number;
  url?: string;
  usersPooling?: string[];
  meta?: Meta;
};

const q: queueAsPromised<Task> = fastq.promise(asyncWorker, 5);

const isGenerateAverageMethod = (meta: Meta) => {
  if (meta && typeof meta?.method !== "undefined") {
    return meta.method === Method["crawl_complete"];
  }
  return false;
};

async function asyncWorker(arg: Task): Promise<ResponseModel | boolean> {
  const { url: urlMap, userId, usersPooling = [], meta } = arg;

  try {
    // if method is crawl_complete
    if (isGenerateAverageMethod(meta)) {
      const props = meta?.extra;
      return await setWebsiteScore({
        domain: props?.domain,
        userId: Number(userId),
      });
    }
    // TODO: CLEANUP URL-URLMAP
    return await crawl({ userId, url: urlMap, usersPooling });
  } catch (e) {
    console.error(e);
  }
}

interface MessageData {
  pages: string[];
  user_id: number;
  meta: any; // meta information to call certain events
}

const extractData = (message, single?: boolean, skip?: boolean) => {
  let data: MessageData;
  try {
    if (single) {
      data = typeof message === "string" ? JSON.parse(message) : message;
    } else {
      data =
        typeof message === "string" ? JSON.parse(JSON.parse(message)) : message;
    }
  } catch (e) {
    if (!skip) {
      // retry once
      extractData(message, true, true);
    } else {
      console.error(e);
    }
  }

  return data;
};

// TODO: determine queue order
export const crawlPageQueue = async (queueSource) => {
  try {
    const data = extractData(queueSource);

    const { pages = [], user_id, meta } = data;

    if (isGenerateAverageMethod(meta)) {
      return await q.push({
        userId: user_id,
        meta,
      });
    }

    for (const url of pages) {
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
