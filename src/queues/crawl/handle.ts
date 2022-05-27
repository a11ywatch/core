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

// if the gRPC request was crawl complete. TODO: seperate method call
export const isGenerateAverageMethod = (meta: Meta) => {
  if (meta && typeof meta?.method !== "undefined") {
    return meta.method === Method["crawl_complete"];
  }
  return false;
};

// the async worker to use
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

export const q: queueAsPromised<Task> = fastq.promise(asyncWorker, 3);
