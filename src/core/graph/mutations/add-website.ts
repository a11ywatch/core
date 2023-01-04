import { UsersController, WebsitesController } from "../../controllers";
import { getPayLoad } from "../../utils/query-payload";

export const addWebsite = async (
  _,
  {
    url,
    customHeaders,
    pageInsights,
    mobile,
    ua,
    standard,
    actions,
    robots,
    subdomains,
    tld,
    ignore,
    ...props
  },
  context
) => {
  const { userId } = getPayLoad(context, props);

  // TODO: centralize scan attempt via events.
  const canScan = await UsersController().updateScanAttempt({
    userId: userId,
  });

  return await WebsitesController().addWebsite({
    userId,
    url,
    customHeaders,
    canScan,
    pageInsights,
    mobile,
    ua,
    standard,
    actions,
    robots,
    subdomains,
    tld,
    ignore,
  });
};
