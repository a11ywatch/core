import { connect } from "@app/database";
import { websiteSearchParams } from "@app/core/utils";

export const HistoryController = ({ user } = { user: null }) => ({
  getHistoryItem: async (params: {
    userId?: number;
    url?: string;
    domain?: string;
  }) => {
    try {
      const [collection] = await connect("History");
      const searchProps = websiteSearchParams(params);
      const history = await collection.findOne(searchProps);

      return [history, collection];
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
