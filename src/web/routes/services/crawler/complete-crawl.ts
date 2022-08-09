import { getParams } from "./get-params";
import { getHostName } from "@app/core/utils";
import { qWebsiteWorker } from "@app/queues/crawl";

export const crawlTrackerComplete = async (data?: any) => {
  const {
    user_id: userId,
    domain: dm,
    full = false,
  } = typeof data === "string" ? getParams(data) : data;

  if (dm) {
    const domain = getHostName(dm);

    // if a full scan was performed allow performing website averaging.
    if (full) {
      await qWebsiteWorker
        .push({
          userId,
          meta: {
            extra: { domain },
          },
        })
        .catch((err) => console.error(err));
    }
  }
};
