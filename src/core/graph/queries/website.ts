import { getPayLoad } from "../../utils/query-payload";

export const website = async (_, { url, ...props }, context) => {
  const [website] = await context.models.Website.getWebsite({
    userId: getPayLoad(context, props),
    url,
  });

  return website;
};

export const websites = async (_, props, context) => {
  return await context.models.Website.getWebsites({
    userId: getPayLoad(context, props),
  });
};
