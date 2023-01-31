import { sourceBuild } from "@a11ywatch/website-source-builder";
import { emailMessager } from "../../messagers";
import { pubsub } from "../../../database/pubsub";
import { ISSUE_ADDED } from "../../static";
import { collectionUpsert } from "../../utils";
import { IssuesController } from "../../controllers/issues";
import { getWebsite } from "../../controllers/websites";
import { AnalyticsController } from "../../controllers/analytics";
import { getPage } from "../../controllers/pages/find";
import { UsersController } from "../../controllers/users";
import { extractPageData } from "../../utils/shapes/extract-page-data";
import { filterRunnerDuplicates } from "../../utils/filters/runners";
import { fetchPageIssues } from "./fetch-issues";
import { ResponseModel } from "../../models/response/types";
import { crawlEmitter, crawlTrackingEmitter } from "../../../event";
import { SUPER_MODE } from "../../../config/config";
import { findPageActionsByPath } from "../../controllers/page-actions/find";
import { validateScanEnabled } from "../../controllers/users/update/scan-attempt";
import { RATE_EXCEEDED_ERROR } from "../../strings";
import { collectionIncrement } from "../../utils/collection-upsert";
import { SCAN_TIMEOUT } from "../../strings/errors";
import { StatusCode } from "../../../web/messages/message";
import type { User, Website } from "../../../types/types";
import { watcherCrawl } from "./watcher_crawl";
import { shapeResponse } from "../../models/response/shape-response";
import { crawlingSet, getKey } from "../../../event/crawl-tracking";
import type { Collection, Document } from "mongodb";
import { getActiveCrawlKey } from "../../../event/names";

export type CrawlConfig = {
  userId: number; // user id
  url: string; // the target url to crawl
  pageInsights?: boolean; // use page insights to get info
  sendSub?: boolean; // use pub sub
  user?: User; // optional pass user
  html?: string; // raw html to validate
  standard?: string; // accessibility standard
  ignore?: string[]; // ignore list of rules
  rules?: string[]; // list of rules
  runners?: string[]; // list of runners axe, htmlcs, and a11y
};

// track the crawl events between crawls
const trackerProccess = (
  data: any,
  { domain, urlMap, userId, shutdown = false }: any,
  blockEvent?: boolean
) => {
  // send data back to rpc or http stream emitter
  if (!blockEvent && data) {
    crawlEmitter.emit(getActiveCrawlKey(domain, userId), data);
  }

  crawlTrackingEmitter.emit("crawl-processed", {
    user_id: userId,
    domain,
    pages: [urlMap],
    shutdown,
  });
};

// determine insights
const getInsightsEnabled = ({
  pageInsights,
  insightsLocked,
  pageSpeedApiKey,
  rootPage,
}) =>
  insightsLocked && !pageSpeedApiKey ? pageInsights && rootPage : pageInsights;

/**
 * Send to gRPC pagemind request. Stores data upon return into database.
 *
 * Examples:
 *
 *     await crawlPage({ url: "https://a11ywatch.com" });
 *     await crawlPage({ url: "https://a11ywatch.com", sendSub: true }); // send pub sub to front-end client
 *     await crawlPage({ url: "https://a11ywatch.com", userId: 122, pageInsights: true }); // run request with lighthouse
 *     await crawlPage({ url: "https://a11ywatch.com", userId: 122, pageInsights: true }, true); // send email with config
 */
export const crawlPage = async (
  crawlConfig: CrawlConfig,
  sendEmail?: boolean, // determine if email should be sent based on results
  blockEvent?: boolean // block event from emitting to protect crawl interfere
): Promise<ResponseModel> => {
  const {
    url: urlMap,
    pageInsights = false,
    user: usr,
    sendSub: sub,
    html,
    standard,
    ignore,
    rules,
    runners,
  } = crawlConfig ?? {};

  // detect if redis is connected to send subs
  const sendSub: boolean = sub ?? true;
  const userId = usr?.id ?? crawlConfig?.userId;

  // todo: use prior user params if found
  const [userData, userCollection] = await UsersController().getUser({
    id: userId,
  });

  const { pageUrl, domain, pathname } = sourceBuild(urlMap);

  // block scans from running
  if (!sendEmail && validateScanEnabled({ user: userData }) === false) {
    trackerProccess(
      undefined,
      { domain, urlMap, userId, shutdown: true },
      blockEvent
    );

    return shapeResponse({
      data: null,
      code: 300,
      success: false,
      message: RATE_EXCEEDED_ERROR,
    });
  }

  // WEBSITE COLLECTION
  const [website, websiteCollection] = await getWebsite({
    domain,
    userId,
  });

  const { role: urole, pageSpeedApiKey, scanInfo } = userData ?? {};
  const {
    standard: websiteStandard,
    pageHeaders,
    pageInsights: websitePageInsights,
    mobile,
    ua,
    ignore: websiteIgnore,
    rules: websiteRules,
    runners: websiteRunners,
  } = website ?? {};

  const freeAccount = !urole; // free account
  const rootPage = pathname === "/"; // the url is the base domain index.

  const actions = await findPageActionsByPath({ userId, path: pathname });

  const dataSource = await fetchPageIssues({
    pageHeaders,
    url: urlMap,
    userId,
    pageInsights: getInsightsEnabled({
      pageInsights: pageInsights || websitePageInsights,
      insightsLocked: !SUPER_MODE && freeAccount,
      pageSpeedApiKey: !!pageSpeedApiKey,
      rootPage,
    }),
    mobile,
    ua,
    standard: standard || websiteStandard,
    actions,
    cv: SUPER_MODE || !!urole,
    pageSpeedApiKey: pageSpeedApiKey,
    html,
    ignore:
      ignore && Array.isArray(ignore) && ignore.length ? ignore : websiteIgnore,
    rules: rules && Array.isArray(rules) && rules.length ? rules : websiteRules,
    runners: filterRunnerDuplicates(
      runners && Array.isArray(runners) && runners.length
        ? runners
        : websiteRunners || []
    ),
  });

  let shutdown = false;

  if (!SUPER_MODE) {
    const ttime = dataSource?.usage || 0;
    const pastUptime = scanInfo?.totalUptime || 0;

    shutdown =
      validateScanEnabled({
        user: {
          role: urole,
          scanInfo: {
            usageLimit: scanInfo?.usageLimit,
            totalUptime: ttime + pastUptime,
          },
        },
      }) === false;

    // todo: negate usage from uptime outside plan. One generic method to handle uptime.
    setImmediate(async () => {
      await collectionIncrement(
        {
          "scanInfo.totalUptime": ttime, // add new uptime to collection
        },
        userCollection,
        { id: userId }
      ); // User
    });
  }

  // TODO: SET PAGE OFFLINE DB
  if (!dataSource || !dataSource?.webPage?.issuesInfo || shutdown) {
    trackerProccess(
      undefined,
      { domain, urlMap, userId, shutdown },
      blockEvent
    );

    return shapeResponse({
      data: null,
      code: StatusCode.BadRequest,
      success: false,
      message: SCAN_TIMEOUT,
    });
  }

  const {
    issues: pageIssues,
    webPage,
    issuesInfo,
  } = extractPageData(dataSource);

  // issues array
  const issueCount = pageIssues.issues.length;

  // if HTML passed and from crawler or valid content enable storing
  if ((html && urlMap) || !html) {
    // if website record exist update integrity of the data.
    if (website) {
      setImmediate(async () => {
        // if ROOT domain for scan update Website Collection.
        if (rootPage) {
          await collectionUpsert(
            {
              domain: webPage.domain,
              url: webPage.url,
              pageLoadTime: webPage.pageLoadTime,
              lastScanDate: webPage.lastScanDate,
              online: true,
              userId,
            },
            [websiteCollection, !!webPage],
            {
              searchProps: { url: pageUrl, userId },
            }
          );
        }

        const [issueExist, issuesCollection] =
          await IssuesController().getIssue(
            { pageUrl, userId, noRetries: true },
            true
          );

        // todo: track all page information
        // if issues exist prior or current update collection
        // Add to Issues collection if page contains issues or if record should update/delete.
        if (issueCount || issueExist) {
          const [[analytics, analyticsCollection], [newSite, pagesCollection]] =
            await Promise.all([
              AnalyticsController().getWebsite({ pageUrl, userId }, true),
              getPage({
                userId,
                url: pageUrl,
              }),
            ]);

          await Promise.all([
            // analytics
            collectionUpsert(
              {
                pageUrl,
                domain,
                userId,
                possibleIssuesFixedByCdn: issuesInfo.possibleIssuesFixedByCdn,
                totalIssues: issuesInfo.totalIssues,
                issuesFixedByCdn: issuesInfo.issuesFixedByCdn,
                errorCount: issuesInfo.errorCount,
                warningCount: issuesInfo.warningCount,
                noticeCount: issuesInfo.noticeCount,
                accessScore: issuesInfo.accessScore,
              },
              [analyticsCollection, analytics]
            ),
            // issues
            collectionUpsert(
              {
                issues: pageIssues.issues,
                documentTitle: pageIssues.documentTitle,
                pageUrl: pageIssues.pageUrl,
                domain: pageIssues.domain,
                userId,
              },
              [issuesCollection, issueExist, !issueCount],
              {
                searchProps: { pageUrl, userId },
              }
            ),
            // pages
            collectionUpsert(
              {
                domain: webPage.domain,
                url: webPage.url,
                pageLoadTime: webPage.pageLoadTime,
                lastScanDate: webPage.lastScanDate,
                userId,
                online: true,
              },
              [pagesCollection as Collection<Document>, newSite, !issueCount], // delete document if issues do not exist
              {
                searchProps: { url: pageUrl, userId },
              }
            ),
          ]);

          // send email if issues of type error exist for the page. TODO: remove from layer.
          if (sendEmail && issuesInfo?.errorCount && userData?.emailConfirmed) {
            await emailMessager.sendMail({
              userId,
              data: {
                issues: pageIssues.issues,
                documentTitle: pageIssues.documentTitle,
                pageUrl: pageIssues.pageUrl,
                domain: pageIssues.domain,
                userId,
                issuesInfo,
              },
              confirmedOnly: true,
              sendEmail: true,
            });
          }
        }
      });
    }

    if (issueCount && sendSub) {
      setImmediate(async () => {
        try {
          await pubsub.publish(ISSUE_ADDED, {
            issueAdded: {
              domain: webPage.domain,
              url: webPage.url,
              pageLoadTime: webPage.pageLoadTime,
              lastScanDate: webPage.lastScanDate,
              issue: pageIssues.issues,
              issuesInfo,
              userId,
              online: true,
            },
          });
        } catch (_) {
          // silent pub sub errors
        }
      });
    }
  }

  const responseData = {
    data: {
      domain: webPage.domain,
      url: webPage.url,
      pageLoadTime: webPage.pageLoadTime,
      lastScanDate: webPage.lastScanDate,
      issues: pageIssues.issues,
      issuesInfo,
      userId,
      online: true,
    },
  };

  trackerProccess(
    responseData,
    {
      domain,
      urlMap,
      userId,
      shutdown,
    },
    blockEvent
  );

  return shapeResponse(responseData);
};

// async generator for large jobs
async function* entriesFromWebsite(
  pages: string[],
  userId: number
): AsyncGenerator<[ResponseModel, string]> {
  for (const url of pages) {
    yield [await crawlPage({ url, userId }, false), url];
  }
}

// async generator for full site wide scans [only non active crawls]
export async function* entriesFromWebsiteSync(
  pages: Website[]
): AsyncGenerator<[void, string]> {
  for (const { url, userId, subdomains, tld, ua, proxy } of pages) {
    yield [
      !crawlingSet.has(getKey(url, [], userId)) &&
        (await watcherCrawl({
          url,
          subdomains,
          tld,
          userId,
          scan: true,
          agent: ua,
          proxy,
        })),
      url,
    ];
  }
}

/*
 * Send request for crawl queue - Sends an email follow up on the crawl data. TODO: remove from file.
 * @return Promise<Websites | Pages>
 */
export const crawlMultiSite = async (data) => {
  const { pages = [], userId: uid, user_id } = data;
  const userId = uid ?? user_id;
  const responseData = [];

  for await (const [scanResult, url] of entriesFromWebsite(pages, userId)) {
    responseData.push(scanResult.data ?? { url, online: scanResult.success });
  }

  return responseData;
};
