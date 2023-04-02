import { historyCollection } from "../../../database";
import { websiteSearchParams } from "../../utils";

export const HistoryController = ({ user } = { user: null }) => ({
  getHistoryItem: async (params: {
    userId?: number;
    url?: string;
    domain?: string;
  }) => {
    const searchProps = websiteSearchParams(params);
    const history = await historyCollection.findOne(searchProps);

    return [history, historyCollection];
  },
  getHistory: async ({ userId }) => {
    return await historyCollection.find({ userId }).limit(100).toArray();
  },
});
