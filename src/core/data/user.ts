import { AnalyticsController, HistoryController } from "../controllers";
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
