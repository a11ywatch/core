import { WEBSITE_NOT_FOUND, SUCCESS } from "@app/core/strings";
import { getWebsite } from "../find";

export const updateWebsite = async ({
  userId,
  url,
  pageHeaders,
  pageInsights,
}) => {
  try {
    const [website, collection] = await getWebsite({ userId, url }, true);

    if (!website) {
      throw new Error(WEBSITE_NOT_FOUND);
    }

    const pageHeaderSrc =
      pageHeaders?.length === 1 && !pageHeaders[0].key ? null : pageHeaders;

    const pageParams = pageHeaders
      ? { pageHeaders: pageHeaderSrc, pageInsights: website?.pageInsights }
      : {};

    if (typeof pageInsights !== "undefined") {
      pageParams.pageInsights = pageInsights;
    }

    await collection.updateOne({ url, userId }, { $set: pageParams });

    return { website, code: 200, success: true, message: SUCCESS };
  } catch (e) {
    console.error(e);
  }
};
