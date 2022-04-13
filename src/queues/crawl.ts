import fastq from "fastq";
import { crawlWebsite as crawl } from "@app/core/controllers/subdomains/update";
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

const q: queueAsPromised<Task> = fastq.promise(asyncWorker, 2);

const isGenerateAverageMethod = (meta: Meta) => {
  if (meta && typeof meta?.method !== "undefined") {
    return meta.method === Method["crawl_complete"];
  }
  return false;
};

async function asyncWorker(arg: Task): Promise<ResponseModel | boolean> {
  const { url: urlMap, userId, usersPooling = [], meta } = arg;

  try {
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

// TODO: determine queue order
export const crawlPageQueue = async (message) => {
  try {
    const data =
      typeof message === "string" ? JSON.parse(JSON.parse(message)) : message;

    const { pages = [], user_id, meta } = data;

    if (isGenerateAverageMethod(meta)) {
      await q.push({
        userId: user_id,
        meta,
      });
      return;
    }

    for (const url of pages) {
      const usersPooling = await getActiveUsersCrawling({
        userId: user_id,
        urlMap: url,
      });

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
