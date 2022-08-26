import { getParams } from "./get-params";
import { getHostName } from "../../../../core/utils";
import { qWebsiteWorker } from "../../../../queues/crawl";

export const crawlTrackerComplete = async (data?: any) => {
  const {
    user_id: userId,
    domain,
    full = false,
  } = typeof data === "string" ? getParams(data) : data;

  // TODO: re-visit full
  if (domain && full) {
    await qWebsiteWorker
      .push({
        userId,
        meta: {
          extra: { domain: getHostName(domain) },
        },
      })
      .catch((err) => console.error(err));
  }
};
