import { HistoryController } from "../../../core/controllers";
import { getPayLoad } from "../../../core/utils/query-payload";

export const history = async (_, { ...props }, context) => {
  const userId = getPayLoad(context, props)?.userId;

  return await HistoryController().getHistory({
    userId,
  });
};
