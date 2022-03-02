import { WEBSITE_NOT_FOUND, SUCCESS } from "@app/core/strings";
import { getWebsite } from "../find";

export const updateWebsite = async ({
  userId,
  url,
  pageHeaders,
  pageInsights,
}) => {
  try {
    const [website, collection] = await getWebsite({ userId, url });

    if (!website) {
      throw new Error(WEBSITE_NOT_FOUND);
    }

    const pageParams = {
      pageHeaders: website.pageHeaders,
      pageInsights: !!website.pageInsights,
    };

    if (typeof pageHeaders !== "undefined") {
      const pageHeaderSrc =
        pageHeaders?.length === 1 && !pageHeaders[0].key ? null : pageHeaders;

      pageParams.pageHeaders = pageHeaderSrc;
    }
    if (typeof pageInsights !== "undefined") {
      pageParams.pageInsights = !!pageInsights;
    }

    await collection.updateOne({ url, userId }, { $set: pageParams });

    return {
      website: { ...website, ...pageParams },
      code: 200,
      success: true,
      message: SUCCESS,
    };
  } catch (e) {
    console.error(e);
  }
};
