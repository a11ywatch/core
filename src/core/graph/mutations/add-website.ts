import { getPayLoad } from "../../utils/query-payload";

export const addWebsite = async (
  _,
  { url, customHeaders, pageInsights, ...props },
  context
) => {
  const { audience, userId } = getPayLoad(context, props);

  const canScan = await context.models.User.updateScanAttempt({
    userId: userId,
  });

  return await context.models.Website.addWebsite({
    userId,
    url,
    audience,
    customHeaders,
    canScan,
    pageInsights,
  });
};
