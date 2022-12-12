import { FastifyContext } from "apollo-server-fastify";
import { getUserFromApiScan } from "../../core/utils/get-user-data";
import { responseModel } from "../../core/models";
import { StatusCode } from "../messages/message";
import { getWebsitesPaging } from "../../core/controllers/websites/find/get";
import { entriesFromWebsiteSync } from "../../core/actions/accessibility/crawl";

// perform a account wide website crawl all
export const backgroundSync = async (
  req: FastifyContext["request"],
  res: FastifyContext["reply"]
) => {
  const userNext = await getUserFromApiScan(
    req?.headers?.authorization || req?.cookies?.jwt,
    req,
    res
  );

  if (userNext) {
    setImmediate(async () => {
      const websites = await getWebsitesPaging({
        userId: userNext.id,
        limit: 50,
        offset: 0,
        insights: true, // TODO: make insights optional
      });

      for await (const [_, _url] of entriesFromWebsiteSync(websites)) {
        // send pubsub of websites crawling
      }
    });

    res.send(
      responseModel({
        code: StatusCode.Ok,
        data: true,
        message: "Sync in progress",
      })
    );
  }
};
