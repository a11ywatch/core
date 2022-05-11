import { WEBSITE_NOT_FOUND, SUCCESS } from "@app/core/strings";
import { getWebsite } from "../find";

export const updateWebsite = async ({
  userId,
  url,
  pageHeaders,
  pageInsights,
  mobile,
}) => {
  let website;
  let collection;

  try {
    [website, collection] = await getWebsite({ userId, url });
  } catch (e) {
    console.error(e);
  }

  if (!website) {
    throw new Error(WEBSITE_NOT_FOUND);
  }

  // params prior - we mutate this on update
  const pageParams = {
    pageHeaders: website.pageHeaders,
    pageInsights: !!website.pageInsights,
    mobile: !!website.mobile,
  };

  // if page headers are sent add them
  if (typeof pageHeaders !== "undefined") {
    const pageHeaderSrc =
      pageHeaders?.length === 1 && !pageHeaders[0].key ? null : pageHeaders;

    pageParams.pageHeaders = pageHeaderSrc;
  }

  // if lighthouse is enabled
  if (typeof pageInsights !== "undefined") {
    pageParams.pageInsights = !!pageInsights;
  }

  // if mobile viewport is enabled
  if (typeof mobile !== "undefined") {
    pageParams.mobile = !!mobile;
  }

  try {
    await collection.updateOne({ url, userId }, { $set: pageParams });
  } catch (e) {
    console.error(e);
  }

  return {
    website: { ...website, ...pageParams },
    code: 200,
    success: true,
    message: SUCCESS,
  };
};
