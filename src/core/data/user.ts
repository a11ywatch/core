import {
  AnalyticsController,
  HistoryController,
  ScriptsController,
} from "../controllers";
import { viewUpcomingInvoice } from "../controllers/users/update/payments";
import { getWebsitesPaging } from "../controllers/websites/find/get";

export const User = {
  history: async ({ id, keyid }) => {
    return await HistoryController().getHistory({
      userId: id || keyid,
    });
  },
  analytics: async ({ id, keyid }) => {
    return await AnalyticsController().getAnalytics({
      userId: id || keyid,
    });
  },
  script: async ({ id, filter, keyid }, { url, pageUrl }) => {
    return await ScriptsController().getScript(
      {
        userId: id || keyid,
        pageUrl: url || pageUrl,
        filter,
        noRetries: false,
      },
      false
    );
  },
  scripts: async ({ id, keyid }, { url, pageUrl }) => {
    return await ScriptsController().getScripts({
      userId: id || keyid,
      pageUrl: url || pageUrl,
    });
  },
  websites: async ({ id, keyid }, params) => {
    const webpages = await getWebsitesPaging({
      insights: true,
      userId: id || keyid,
      ...params,
    });

    return webpages ?? [];
  },
  // view upcoming invoice
  invoice: async ({ id, keyid }, params) => {
    return await viewUpcomingInvoice({
      userId: id || keyid,
      ...params,
    });
  },
};
