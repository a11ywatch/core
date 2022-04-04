import { sub } from "./pubsub";
import { crawlWebsite as crawl } from "@app/core/controllers/subdomains/update";
import fastq from "fastq";
import type { queueAsPromised } from "fastq";
import { ResponseModel } from "@app/core/models/response/types";
import { getActiveUsersCrawling } from "@app/core/utils/query";

import { Method, Channels } from "./config";
import { setWebsiteScore } from "@app/core/utils/stats/score";

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
const crawlPageQueue = async (message) => {
  try {
    const data = JSON.parse(JSON.parse(message));
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
