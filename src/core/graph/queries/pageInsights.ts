import { PageSpeedController } from "../../controllers";
import { getPayLoad } from "../../utils/query-payload";

export const pageInsights = async (_, { url, pageUrl, ...props }, context) => {
  const userId = getPayLoad(context, props)?.userId;

  return await PageSpeedController().getWebsite({
    userId,
    pageUrl: url || pageUrl,
  });
};
