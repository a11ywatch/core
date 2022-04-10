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

export const crawlAllAuthedWebsitesCluster = async (): Promise<void> => {
  let allWebPages = [];
  let pageChunk = [];
  const morning = getHours(new Date()) === 11;
  const userFilter = morning ? { emailMorningOnly: { eq: true } } : {};

  try {
    // TODO: move generate website in batch 20
    [allWebPages] = await getWebsitesWithUsers(0, userFilter);
  } catch (e) {
    console.error(e);
  }

  pageChunk = chunk(allWebPages, Math.max(2, cpus().length / 2));
  allWebPages = []; // remove pages from memory

  const forked = new Worker(`${__dirname}/watch_worker`);
  forked.unref();

  let i = 0;
  for (const chunk of pageChunk) {
    forked.postMessage({ websites: chunk, exit: i === pageChunk.length - 1 });
    i++;
  }
};
