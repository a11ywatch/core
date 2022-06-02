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
  meta?: Meta;
  fromQueue?: boolean;
};

// the async worker to use for crawling pages
async function asyncWorker(arg: Task): Promise<ResponseModel | boolean> {
  try {
    return await crawl(arg);
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
    return await setWebsiteScore({
      domain: props?.domain,
      userId: Number(userId),
    });
  } catch (e) {
    console.error(e);
  }
}

// crawl queue
export const q: queueAsPromised<Task> = fastq.promise(asyncWorker, 4);
// crawl queue lighthouse - only one process allowed at time
export const qLh: queueAsPromised<Task> = fastq.promise(asyncWorker, 1);
export const qWebsiteWorker: queueAsPromised<Task> = fastq.promise(
  asyncWorkerCrawlComplete,
  20
);
