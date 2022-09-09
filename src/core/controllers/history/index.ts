import { connect } from "../../../database";
import { websiteSearchParams } from "../../utils";

export const HistoryController = ({ user } = { user: null }) => ({
  getHistoryItem: async (params: {
    userId?: number;
    url?: string;
    domain?: string;
  }) => {
    const [collection] = await connect("History");
    const searchProps = websiteSearchParams(params);
    const history = await collection.findOne(searchProps);

    return [history, collection];
  },
  getHistory: async ({ userId }) => {
    const [collection] = await connect("History");
    return await collection.find({ userId }).limit(100).toArray();
  },
});
