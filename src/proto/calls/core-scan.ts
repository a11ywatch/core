import type { sendUnaryData, ServerWritableStream } from "@grpc/grpc-js";
import { crawlPage } from "../../core/actions";
import { SUPER_MODE } from "../../config/config";
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
    // todo: get rate limits
    const { data } = await crawlPage(
      {
        url,
        userId,
        pageInsights: !!pageInsights,
        sendSub: false,
      },
      false
    );

    callback(null, { data });
  } else {
    callback(null, { data: null });
  }
};
