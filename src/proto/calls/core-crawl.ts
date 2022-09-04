import type { ServerWritableStream } from "@grpc/grpc-js";
import { incrementApiByUser } from "../../core/controllers/users/find/get-api";
import { getCrawlConfig } from "../../core/streams/crawl-config";
import { watcherCrawl } from "../../core/actions/accessibility/watcher_crawl";
import { crawlEmitter, crawlTrackingEmitter } from "../../event";
import { getKey } from "../../event/crawl-tracking";
import { domainName } from "../../core/utils/domain-name";
import { getHostName } from "../../core/utils/get-host";
import type { CrawlProps } from "../../core/utils/crawl-stream";

type ServerCallStreaming = ServerWritableStream<
  { url: string; authorization: string; subdomains: boolean; tld: boolean },
  {}
>;

// core multi page streaming gRPC scanning
export const coreCrawl = async (call: ServerCallStreaming) => {
  const { authorization, url, subdomains, tld } = call.request;
  const userNext = await incrementApiByUser(authorization);

  const crawlProps = await getCrawlConfig({
    id: userNext.id,
    url,
    role: userNext.role,
    subdomains,
    tld,
  });

  await crawlStreaming(crawlProps, call);

  call.end();
};

// crawl website slim and wait for finished emit event to continue @return Website[].
export const crawlStreaming = (
  props: CrawlProps & {
    norobo?: boolean;
  },
  call: ServerCallStreaming
): Promise<boolean> => {
  const { url, userId, subdomains, tld, norobo } = props;

  setImmediate(async () => {
    await watcherCrawl({
      url,
      userId,
      subdomains: !!subdomains,
      tld: !!tld,
      scan: true,
      robots: !norobo,
    });
  });

  return new Promise((resolve) => {
    const domain = getHostName(url);
    const crawlKey = `${domainName(domain)}-${userId || 0}`;
    const crawlEvent = `crawl-${crawlKey}`;

    const crawlListener = (source) => {
      const data = source?.data;

      if (data) {
        data.pageLoadTime = null;
        data.issues = null;
        call.write({ data });
      }
    };

    crawlEmitter.on(crawlEvent, crawlListener);

    crawlTrackingEmitter.once(
      `crawl-complete-${getKey(domain, undefined, userId)}`,
      (data) => {
        crawlEmitter.off(crawlEvent, crawlListener);
        resolve(data);
      }
    );
  });
};
