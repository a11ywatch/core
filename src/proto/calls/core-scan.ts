import type { sendUnaryData, ServerWritableStream } from "@grpc/grpc-js";
import { crawlPage } from "../../core/actions";
import { DISABLE_STORE_SCRIPTS, SUPER_MODE } from "../../config/config";
import { getUserFromToken } from "../../core/utils";
import { validateUID } from "../../web/params/extracter";

// core single page scan with results
export const coreScan = async (
  call: ServerWritableStream<
    { url: string; authorization: string; pageInsights: boolean },
    {}
  >,
  callback: sendUnaryData<any>
) => {
  const { authorization, url, pageInsights } = call.request;
  const userNext = getUserFromToken(authorization); // get current user
  const userId = userNext?.payload?.keyid;

  if (validateUID(userId) || SUPER_MODE) {
    const noStore = DISABLE_STORE_SCRIPTS || !userNext?.payload?.audience;

    // todo: get rate limits

    const { data } = await crawlPage(
      {
        url,
        userId,
        pageInsights: !!pageInsights,
        sendSub: false,
        noStore,
      },
      false
    );

    callback(null, { data });
  } else {
    // todo: add error messaging
    callback(null, { data: null });
  }
};
