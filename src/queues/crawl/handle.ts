import fastq from "fastq";
import { crawlWebsite as crawl } from "@app/core/actions";
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

// // if the gRPC request was crawl complete. TODO: seperate method call
// export const isGenerateAverageMethod = (meta: Meta) => {
//   if (meta && typeof meta?.method !== "undefined") {
//     return meta.method === Method["crawl_complete"];
//   }
//   return false;
// };

// the async worker to use for crawling pages
async function asyncWorker(arg: Task): Promise<ResponseModel | boolean> {
  const { url: urlMap, userId, usersPooling = [] } = arg;

  try {
    return await crawl({ userId, url: urlMap, usersPooling });
  } catch (e) {
    console.error(e);
  }
}

// the async worker to use for completed crawl actions.
async function asyncWorkerCrawlComplete(
  arg: Task
): Promise<ResponseModel | boolean> {
  const { userId, meta } = arg;
  const props = meta?.extra;

  try {
    // if method is crawl_complete
    return await setWebsiteScore({
      domain: props?.domain,
      userId: Number(userId),
    });
  } catch (e) {
    console.error(e);
  }
}

export const q: queueAsPromised<Task> = fastq.promise(asyncWorker, 3);

export const qWebsiteWorker: queueAsPromised<Task> = fastq.promise(
  asyncWorkerCrawlComplete,
  20
);
