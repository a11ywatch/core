import { getPayLoad } from "../../utils/query-payload";

export const history = async (_, { url, ...props }, context) => {
  const userId = getPayLoad(context, props)?.userId;

  return await context.models.History.getHistory({
    userId,
    url,
  });
};
