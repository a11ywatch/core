import { Worker } from "worker_threads";
import { getHours } from "date-fns";
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

const forkWatch = (workerData) =>
  new Worker(`${__dirname}/watch_worker`, {
    workerData,
  });

export const crawlAllAuthedWebsitesCluster = async (): Promise<void> => {
  const morning = getHours(new Date()) === 11;
  const userFilter = morning ? { emailMorningOnly: { eq: true } } : {};
  let allWebPages = [];
  let pageChunk = [];

  try {
    // TODO: move generate website to queue
    [allWebPages] = await getWebsitesWithUsers(0, userFilter);
  } catch (e) {
    console.error(e);
  }

  pageChunk = chunk(allWebPages, 2);
  allWebPages = [];

  for (const chunk of pageChunk) {
    const forked = forkWatch(chunk);
    forked.unref();
  }
};
