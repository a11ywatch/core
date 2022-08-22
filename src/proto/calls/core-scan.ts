import { getUserFromApi } from "@app/core/utils/get-user-rpc";
import { scanWebsite, crawlPage } from "@app/core/actions";
import { validateUID } from "@app/web/params/extracter";
import { DISABLE_STORE_SCRIPTS } from "@app/config/config";
import type { sendUnaryData, ServerWritableStream } from "@grpc/grpc-js";

// core single page scan with results
export const coreScan = async (
  call: ServerWritableStream<
    { url: string; authorization: string; pageInsights: boolean },
    {}
  >,
  callback: sendUnaryData<any>
) => {
  const { authorization, url, pageInsights } = call.request;
  const userNext = await getUserFromApi(authorization); // get current user

  let data = {};

  if (userNext) {
    const userId = userNext?.id;
    const noStore = DISABLE_STORE_SCRIPTS || !userNext?.role;

    if (validateUID(userId)) {
      const resData = await crawlPage(
        {
          url,
          userId,
          pageInsights: !!pageInsights,
          sendSub: false,
          noStore,
        },
        false
      );
      data = resData?.data;
    } else {
      const resData = await scanWebsite({
        url,
        noStore,
        pageInsights: !!pageInsights,
      });
      data = resData?.data;
    }
  }

  callback(null, { data });
};
