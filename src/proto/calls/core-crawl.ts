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

    const crawlProps = await getCrawlConfig({
      id: userId,
      url,
      role: userNext?.payload?.audience,
      subdomains,
      tld,
      sitemap,
    });

    await crawlStreaming(crawlProps, call);
  }

  call.end();
};

// crawl website slim and wait for finished emit event to continue @return Website[].
export const crawlStreaming = (
  props: CrawlParams & {
    norobo?: boolean;
  },
  call: ServerCallStreaming
): Promise<boolean> => {
  const { url, userId, subdomains, tld, norobo, proxy, sitemap } = props;

  setImmediate(async () => {
    await watcherCrawl({
      url,
      userId,
      subdomains: !!subdomains,
      tld: !!tld,
      scan: true,
      robots: !norobo,
      proxy,
      sitemap
    });
  });

  const crawlListener = (source) => {
    const data = source?.data;

    if (data) {
      call.write({ data });
    }
  };

  return new Promise((resolve) => {
    const crawlKey = `${domainName(getHostName(url))}-${userId || 0}`;
    const crawlEvent = `crawl-${crawlKey}`;

    const crawlCompleteListener = (data) => {
      crawlEmitter.off(crawlEvent, crawlListener);
      resolve(data);
    };

    crawlEmitter.on(crawlEvent, crawlListener);

    crawlTrackingEmitter.once(
      `crawl-complete-${crawlKey}`,
      crawlCompleteListener
    );
  });
};
