import { PagesController } from "../../controllers";
import { getPayLoad } from "../../utils/query-payload";

// pages query
export const pages = async (_, { domain, ...props }, context) => {
  const userId = getPayLoad(context, props)?.userId;

  return await PagesController().getPages({
    userId,
    domain: domain,
  });
};
