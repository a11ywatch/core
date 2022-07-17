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
async function asyncWorkerCrawlComplete(arg: Task): Promise<void> {
  const { userId, meta } = arg;
  const props = meta?.extra;

  try {
    await setWebsiteScore({
      domain: props?.domain,
      userId: Number(userId),
      duration: props?.duration,
      shutdown: !!props?.shutdown,
    });
  } catch (e) {
    console.error(e);
  }
}

// crawl queue [32gb 16, 16gb 8, 8gb 4, 4gb 2]
export const q: queueAsPromised<Task> = fastq.promise(
  asyncWorker,
  Number(process.env.CRAWL_QUEUE_LIMIT || 4)
);
export const qWebsiteWorker: queueAsPromised<Task> = fastq.promise(
  asyncWorkerCrawlComplete,
  20
);
