import { sub, Channels } from "./pubsub";
import { crawlWebsite as crawl } from "@app/core/controllers/subdomains/update";
import fastq from "fastq";
import type { queueAsPromised } from "fastq";
import { ResponseModel } from "@app/core/models/response/types";
import { getActiveUsersCrawling } from "@app/core/utils/query";
import { cpus } from "os";

type Task = {
  userId?: number;
  url?: string;
  usersPooling?: string[];
};

const cpucors = cpus().length;

const q: queueAsPromised<Task> = fastq.promise(
  asyncWorker,
  Math.max(Math.round(cpucors / 2), 2)
);

async function asyncWorker(arg: Task): Promise<ResponseModel> {
  const { url: urlMap, userId, usersPooling } = arg;
  console.log(
    `received crawling task ${urlMap}: users:${usersPooling.length} awaiting scan`
  );

  try {
    // TODO: CLEANUP URL-URLMAP
    return await crawl({ userId, url: urlMap, usersPooling });
  } catch (e) {
    console.error(e);
  }
}

// TODO: determine queue order
const crawlPageQueue = async (message) => {
  try {
    const data = JSON.parse(JSON.parse(message));
    const { pages, user_id } = data;

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

export const setChannels = () => {
  sub.subscribe(Channels.crawl_scan_queue, (err?: any, count?: any) => {
    if (err) {
      console.error("Failed to subscribe: %s", err.message);
    } else {
      console.log(
        `Subscribed successfully! This client is currently subscribed to ${count} channels.`
      );
    }
  });

  sub.on("message", async (channel, message) => {
    if (channel === Channels.crawl_scan_queue) {
      await crawlPageQueue(message);
    }
  });
};
