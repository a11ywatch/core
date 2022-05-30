import { getPayLoad } from "../../utils/query-payload";

export const website = async (_, { url, ...props }, context) => {
  const userId = getPayLoad(context, props)?.userId;

  const [website] = await context.models.Website.getWebsite({
    userId,
    url: decodeURIComponent(url),
  });

  return website;
};

export const websites = async (_, props, context) => {
  const userId = getPayLoad(context, props)?.userId;

  return await context.models.Website.getWebsites({
    userId: userId,
  });
};
