import { getPayLoad } from "../../utils/query-payload";

export const features = async (_, { url, ...props }, context) => {
  return await context.models.Features.getFeatures({
    userId: getPayLoad(context, props),
    url,
  });
};
