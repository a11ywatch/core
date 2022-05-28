import { responseModel } from "../models";
import { crawlMultiSiteWithEvent } from "../utils";
import { getUserFromApiScan } from "../utils/get-user-data";

// perform a lazy stream to keep connection alive.
export const crawlStreamLazy = async (req, res) => {
  try {
    const userNext = await getUserFromApiScan(
      req.headers.authorization,
      req,
      res
    );

    if (!!userNext) {
      const url = decodeURIComponent(req.body?.websiteUrl || req.body?.url);
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Transfer-Encoding": "chunked",
      });

      res.write("[");

      // remove interval for EVENT emmiter.
      const streamInterval = setInterval(() => {
        res.write(
          `${JSON.stringify({
            data: null,
            message: "scan in progress...",
            success: true,
            code: 200,
          })},`
        );
      }, 300);

      // TODO: pass in res and allow emitter of page when processed.
      const { data, message } = await crawlMultiSiteWithEvent({
        url,
        userId: userNext.id,
        scan: false,
      });

      if (streamInterval) {
        clearInterval(streamInterval);
      }

      res.write(
        JSON.stringify(
          responseModel({
            data,
            message,
          })
        )
      );

      res.write("]");
      res.end();
    }
  } catch (e) {
    console.error(e);
  }
};
