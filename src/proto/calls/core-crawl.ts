import { getUserFromApi } from "@app/core/utils/get-user-rpc";
import { getCrawlConfig } from "@app/core/streams/crawl-config";

import { watcherCrawl } from "@app/core/actions/accessibility/watcher_crawl";
import { crawlEmitter, crawlTrackingEmitter } from "@app/event";
import { getKey } from "@app/event/crawl-tracking";

import { domainName } from "@app/core/utils/domain-name";
import { getHostName } from "@app/core/utils/get-host";
import type { CrawlProps } from "@app/core/utils/crawl-stream";

// crawl website slim and wait for finished emit event to continue @return Website[].
export const crawlStreaming = (
  props: CrawlProps,
  res: any // grpc response
): Promise<boolean> => {
  const { url, userId, subdomains, tld } = props;

  setImmediate(async () => {
    await watcherCrawl({
      url,
      scan: true,
      userId,
      subdomains: !!subdomains,
      tld: !!tld,
    });
  });

  return new Promise((resolve) => {
    const domain = getHostName(url);

    crawlEmitter.on(`crawl-${domainName(domain)}-${userId || 0}`, (source) => {
      const data = source?.data;

      // only send when true
      if (data) {
        // trim data for sending miniaml
        data.pageLoadTime = null;
        data.issues = null;
        res.write({ data });
      }
    });

    crawlTrackingEmitter.once(
      `crawl-complete-${getKey(domain, undefined, userId)}`,
      resolve
    );
  });
};

// core multi page streaming gRPC scanning
export const coreCrawl = async (call) => {
  const { authorization, url, subdomains, tld } = call.request;

  const userNext = await getUserFromApi(authorization); // get current user

  if (userNext) {
    const crawlProps = await getCrawlConfig({
      id: userNext.id,
      url,
      role: userNext.role,
      subdomains,
      tld,
    });

    await crawlStreaming(crawlProps, call);
  }

  call?.end();
};
