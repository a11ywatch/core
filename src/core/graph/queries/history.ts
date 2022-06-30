import { HistoryController } from "../../controllers";
import { getPayLoad } from "../../utils/query-payload";

export const history = async (_, { ...props }, context) => {
  const userId = getPayLoad(context, props)?.userId;

  return await HistoryController().getHistory({
    userId,
  });
};
