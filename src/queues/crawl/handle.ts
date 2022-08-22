import fastq from "fastq";
import { cpus } from "os";
import { crawlWebsite } from "@app/core/actions";
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
  return await crawlWebsite(arg);
}

// the async worker to use for completed crawl actions. TODO: remove for collection appending raw value to score.
async function asyncWorkerCrawlComplete(arg: Task): Promise<void> {
  const { userId, meta } = arg;
  const { domain, duration, shutdown } = meta?.extra ?? {};

  await setWebsiteScore({
    domain,
    userId: Number(userId),
    duration,
    shutdown: !!shutdown,
  });
}

// get soft queue limit based on CPUS and crawler limit
// TODO: determine high cpu and control limit.
const crawlQueueLimit = () => {
  if (
    process.env.CRAWL_QUEUE_LIMIT &&
    !Number.isNaN(Number(process.env.CRAWL_QUEUE_LIMIT))
  ) {
    return Number(process.env.CRAWL_QUEUE_LIMIT);
  } else {
    const cors = cpus()?.length || 1;

    return Math.max(3 * cors, 4);
  }
};

// crawl queue handler
export const q: queueAsPromised<Task> = fastq.promise(
  asyncWorker,
  crawlQueueLimit()
);

// determine when crawl completed.
export const qWebsiteWorker: queueAsPromised<Task> = fastq.promise(
  asyncWorkerCrawlComplete,
  20
);
