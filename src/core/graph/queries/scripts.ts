import { getPayLoad } from "../../utils/query-payload";

export const scripts = async (_, { url: pageUrl, ...props }, context) => {
  return await context.models.Scripts.getScripts({
    userId: getPayLoad(context, props),
    pageUrl,
  });
};
