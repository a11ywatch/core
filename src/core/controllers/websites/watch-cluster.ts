import { getHours } from "date-fns";
import { getWebsitesPaginated } from "../websites";
import { DEV } from "@app/config/config";
import { fork } from "child_process";

export const crawlAllAuthedWebsitesCluster = async (): Promise<void> => {
  const morning = getHours(new Date()) === 11;
  console.log(morning ? `morning cron` : "night cron");
  const userFilter = morning ? { emailMorningOnly: { eq: true } } : {};

  const forked = fork(`${__dirname}/watch_worker`, [], {
    detached: true,
    execArgv: DEV
      ? ["-r", "ts-node/register", "-r", "tsconfig-paths/register"]
      : undefined,
  });

  let pages = [];

  const getUsersUntil = async (page = 0) => {
    try {
      const [allWebPages] = await getWebsitesPaginated(20, userFilter, page);
      if (allWebPages?.length) {
        pages.push(...allWebPages);
        await getUsersUntil(page + 1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  await getUsersUntil();

  forked.send({ pages });
  forked.unref();
};
