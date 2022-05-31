import { getPayLoad } from "../../utils/query-payload";

export const scripts = async (_, { url: pageUrl, ...props }, context) => {
  const userId = getPayLoad(context, props)?.userId;

  return await context.models.Scripts.getScripts({
    userId,
    pageUrl: decodeURIComponent(pageUrl),
  });
};
