import { getUserFromApi } from "@app/core/utils/get-user-rpc";
import { scanWebsite, crawlPage } from "@app/core/actions";

// core single page scan with results
export const coreScan = async (call, callback) => {
  const { authorization, url, pageInsights } = call.request;

  const userNext = await getUserFromApi(authorization); // get current user

  let data = {};

  if (userNext) {
    const userId = userNext?.id;

    if (typeof userId !== "undefined") {
      const resData = await crawlPage(
        {
          url,
          userId,
          pageInsights: !!pageInsights,
        },
        false
      );

      data = resData?.data;
    } else {
      const resData = await scanWebsite({
        url,
        noStore: true,
        pageInsights: !!pageInsights,
      });
      data = resData?.data;
    }
  }

  callback(null, { data });
};
