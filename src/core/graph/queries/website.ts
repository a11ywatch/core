import { WebsitesController } from "../../controllers";
import { getPayLoad } from "../../utils/query-payload";

export const website = async (_, { url, ...props }, context) => {
  const userId = getPayLoad(context, props)?.userId;

  const [website] = await WebsitesController().getWebsite({
    userId,
    url: url && decodeURIComponent(url),
  });

  return website;
};

export const websites = async (_, props, context) => {
  const userId = getPayLoad(context, props)?.userId;

  return await WebsitesController().getWebsites({
    userId: userId,
  });
};
