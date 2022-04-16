import { getHours } from "date-fns";
import { getWebsitesWithUsers } from "../websites";
import { DEV } from "@app/config/config";
import { fork } from "child_process";

export const crawlAllAuthedWebsitesCluster = async (): Promise<void> => {
  let allWebPages = [];
  const morning = getHours(new Date()) === 11;
  console.log(morning ? `morning cron` : "night cron");
  const userFilter = morning ? { emailMorningOnly: { eq: true } } : {};

  try {
    // TODO: move generate website to batch limit
    [allWebPages] = await getWebsitesWithUsers(0, userFilter);
  } catch (e) {
    console.error(e);
  }

  // TODO: CHUNK IN HALF
  const forked = fork(`${__dirname}/watch_worker`, [], {
    detached: true,
    execArgv: DEV
      ? ["-r", "ts-node/register", "-r", "tsconfig-paths/register"]
      : undefined,
  });

  console.log(`total websites to scan ${allWebPages.length}`);

  forked.send({ pages: allWebPages });
  forked.unref();
};
