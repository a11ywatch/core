import { Worker } from "worker_threads";
import { getHours } from "date-fns";
import { cpus } from "os";
import { getWebsitesWithUsers } from "../websites";
import type { Website } from "@app/schema";

// TODO: replace with one iteration or db query batching
const chunk = (target: Website[], max: number) => {
  const newArray = [];
  // if array exist split into chunks long
  if (target.length) {
    for (let c = 0; c < max; c++) {
      newArray.push([]);
    }
    for (let i = 0; i < target.length; i++) {
      const slot = i % max;
      newArray[slot].push(target[i]);
    }
  }
  return newArray;
};

// [Internal] method to cleanup invalid domain adds
export const cleanUpInvalidWebsite = async () => {
  let allWebPages = [];
  let collection;

  try {
    // TODO: recursive paginate 20 batch
    [allWebPages, collection] = await getWebsitesWithUsers(0);
  } catch (e) {
    console.error(e);
  }

  const colMap = {};
  allWebPages.forEach(async (item) => {
    // remove duplicates
    if (colMap[item.url]) {
      await collection.findOneAndDelete({ url: item.url });
    } else {
      colMap[item.url] = true;
    }
  });
};

const forkWatch = (workerData) =>
  new Worker(`${__dirname}/watch_worker`, {
    workerData,
  });

export const crawlAllAuthedWebsitesCluster = async (): Promise<void> => {
  let allWebPages = [];
  let pageChunk = [];
  const morning = getHours(new Date()) === 11;
  console.log(morning ? `morning cron` : "night cron");
  const userFilter = morning ? { emailMorningOnly: { eq: true } } : {};

  try {
    // TODO: move generate website to queue
    [allWebPages] = await getWebsitesWithUsers(0, userFilter);
  } catch (e) {
    console.error(e);
  }

  console.log(`total websites to scan ${allWebPages.length}`);

  pageChunk = chunk(allWebPages, Math.max(2, cpus().length / 2));

  console.log(`chunks to process ${pageChunk.length}`);

  for (const chunk of pageChunk) {
    console.log(`chunk size ${chunk.length}`);
    const forked = forkWatch(chunk);
    forked.unref();
  }
};
