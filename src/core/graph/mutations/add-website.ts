import { getPayLoad } from "../../utils/query-payload";

export const addWebsite = async (
  _,
  { url, customHeaders, pageInsights, mobile, ua, standard, actions, ...props },
  context
) => {
  const { audience, userId } = getPayLoad(context, props);

  // TODO: MOVE TO API ENTRY FOR GQL AND REST
  const canScan = await context.models.User.updateScanAttempt({
    userId: userId,
  });

  if (!canScan) {
    throw new Error(
      "You hit your scan limit for the day, please try again tomorrow to add your website."
    );
  }

  return await context.models.Website.addWebsite({
    userId,
    url,
    audience,
    customHeaders,
    canScan,
    pageInsights,
    mobile,
    ua,
    standard,
    actions,
  });
};
