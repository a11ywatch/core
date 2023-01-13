import type { sendUnaryData, ServerWritableStream } from "@grpc/grpc-js";
import { extractLighthouse } from "../../core/utils/shapes/extract-page-data";
import { LIGHTHOUSE } from "../../core/static";
import { connect, pubsub } from "../../database";
import { collectionUpsert } from "../../core/utils";
import { PageSpeedController } from "../../core/controllers/page-speed/main";
import { WebsitesController } from "../../core/controllers";
import { removeTrailingSlash } from "@a11ywatch/website-source-builder";

// lighthouse page updating
export const pageUpdate = async (
  call: ServerWritableStream<
    { domain: string; url: string; user_id: number; insight: any },
    {}
  >,
  callback: sendUnaryData<any>
) => {
  // handle lighthouse data into db and send sub
  setImmediate(async () => {
    const { user_id: userId, url: pageUrl, domain, insight } = call.request;
    const lighthouseResults = extractLighthouse({
      userId,
      domain,
      pageUrl,
      insight,
    });

    // validate the website exist
    const [website] = await WebsitesController().getWebsite({ domain, userId });

    if (website) {
      const [pagesCollection] = connect("Pages");
      const [pageSpeed, pageSpeedCollection] =
        await PageSpeedController().getWebsite(
          { pageUrl: lighthouseResults.pageUrl, userId },
          true
        );

      // upsert lightouse data
      await collectionUpsert(lighthouseResults, [
        pageSpeedCollection,
        pageSpeed,
      ]);

      // update collection after batch async operations
      // add flag on pages for lighthouse
      await collectionUpsert(
        {
          pageInsights: true,
        },
        [pagesCollection, true],
        {
          searchProps: {
            domain,
            userId,
            url: removeTrailingSlash(pageUrl), // todo: add trailing slash removal from root instead of split
          },
        }
      );

      try {
        await pubsub.publish(LIGHTHOUSE, {
          lighthouseResult: {
            userId: lighthouseResults.userId,
            domain: lighthouseResults.domain,
            url: lighthouseResults.pageUrl, // remove trailing for exact match handling [todo: setting for global handling]
            insight: { json: lighthouseResults.json },
          },
        });
      } catch (_) {
        // silent pub sub errors
      }
    }
  });

  callback(null, {});
};
