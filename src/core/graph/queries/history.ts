import { getPayLoad } from "../../utils/query-payload";

export const history = async (_, { url, ...props }, context) => {
  return await context.models.History.getHistory({
    userId: getPayLoad(context, props),
    url,
  });
};
