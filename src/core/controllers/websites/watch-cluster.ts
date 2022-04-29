import { getHours } from "date-fns";
import { getWebsitesPaginated } from "../websites";
import { DEV } from "@app/config/config";
import { fork } from "child_process";

export const crawlAllAuthedWebsitesCluster = async (): Promise<void> => {
  let allWebPages = [];
  const morning = getHours(new Date()) === 11;
  console.log(morning ? `morning cron` : "night cron");
  const userFilter = morning ? { emailMorningOnly: { eq: true } } : {};

  const getUsersUntil = async (page = 0) => {
    try {
      [allWebPages] = await getWebsitesPaginated(80, userFilter, page);

      if (allWebPages?.length) {
        const forked = fork(`${__dirname}/watch_worker`, [], {
          detached: true,
          execArgv: DEV
            ? ["-r", "ts-node/register", "-r", "tsconfig-paths/register"]
            : undefined,
        });

        console.log(
          `total websites to scan ${allWebPages.length}, page: ${page}`
        );

        forked.send({ pages: allWebPages });
        forked.unref();
        await getUsersUntil(page + 1);
      }
    } catch (e) {
      console.error(e);
    }
  };

  await getUsersUntil();
};
