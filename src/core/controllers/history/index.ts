import { connect } from "@app/database";
import { websiteSearchParams } from "@app/core/utils";

export const HistoryController = ({ user } = { user: null }) => ({
  getHistoryItem: async (
    params: { userId?: number; url?: string; domain?: string },
    chain
  ) => {
    try {
      const [collection] = await connect("History");
      const searchProps = websiteSearchParams(params);
      const history = await collection.findOne(searchProps);

      return chain ? [history, collection] : history;
    } catch (e) {
      console.error(e);
      return [null, null];
    }
  },
  getHistory: async ({ userId }) => {
    try {
      const [collection] = await connect("History");
      return await collection.find({ userId }).limit(100).toArray();
    } catch (e) {
      console.error(e);
      return [null];
    }
  },
});
