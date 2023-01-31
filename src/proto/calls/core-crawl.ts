import type { ServerWritableStream } from "@grpc/grpc-js";
import { getCrawlConfig } from "../../core/streams/crawl-config";
import {
  watcherCrawl,
  CrawlParams,
} from "../../core/actions/accessibility/watcher_crawl";
import { crawlEmitter, crawlTrackingEmitter } from "../../event";
import { domainName } from "../../core/utils/domain-name";
import { getHostName } from "../../core/utils/get-host";
import { getUserFromToken } from "../../core/utils";
import { validateUID } from "../../web/params/extracter";
import { SUPER_MODE } from "../../config";
import { validateScanEnabled } from "../../core/controllers/users/update/scan-attempt";
import { UsersController } from "../../core/controllers";

type ServerCallStreaming = ServerWritableStream<
  {
    url: string;
    authorization: string;
    subdomains: boolean;
    tld: boolean;
    sitemap: boolean;
  },
  {}
>;

// core multi page streaming gRPC
export const coreCrawl = async (call: ServerCallStreaming) => {
  const { authorization, url, subdomains, tld, sitemap } = call.request;
  const userNext = getUserFromToken(authorization); // get current user
  const userId = userNext?.payload?.keyid;

  if (validateUID(userId) || SUPER_MODE) {
    // todo: get rate limits
    if (!SUPER_MODE) {
      const [user] = await UsersController().getUser({
        id: userId,
      });

      // block scans from running
      if (validateScanEnabled({ user }) === false) {
        return call.end();
      }
    }

    await crawlStreaming(
      await getCrawlConfig({
        id: userId,
        url,
        role: userNext?.payload?.audience,
        subdomains,
        tld,
        sitemap,
      }),
      call
    );
  }

  call.end();
};

// crawl website slim and wait for finished emit event to continue @return Website[].
export const crawlStreaming = async (
  props: CrawlParams & {
    norobo?: boolean;
  },
  call: ServerCallStreaming
): Promise<boolean> => {
  const { url, userId, subdomains, tld, norobo, proxy, sitemap } = props;
  const crawlKey = `${domainName(getHostName(url))}-${userId || 0}`;
  const crawlEvent = `crawl-${crawlKey}`;

  return new Promise(async (resolve) => {
    // audit data event
    const crawlListener = ({ data }) => {
      data && call.write({ data });
    };
    // bind listeners
    const crawlCompleteListener = (data) => {
      crawlEmitter.off(crawlEvent, crawlListener);
      resolve(data);
    };

    crawlEmitter.on(crawlEvent, crawlListener);

    crawlTrackingEmitter.once(
      `crawl-complete-${crawlKey}`,
      crawlCompleteListener
    );

    // start crawl
    await watcherCrawl({
      url,
      userId,
      subdomains: !!subdomains,
      tld: !!tld,
      scan: true,
      robots: !norobo,
      proxy,
      sitemap,
    });
  });
};
