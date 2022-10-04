import { sourceBuild } from "@a11ywatch/website-source-builder";
import { emailMessager } from "../../messagers";
import { pubsub } from "../../../database/pubsub";
import { ISSUE_ADDED } from "../../static";
import { responseModel } from "../../models";
import { collectionUpsert, domainName } from "../../utils";
import { IssuesController } from "../../controllers/issues";
import { ScriptsController } from "../../controllers/scripts";
import { getWebsite } from "../../controllers/websites";
import { AnalyticsController } from "../../controllers/analytics";
import { getPage } from "../../controllers/pages/find";
import { UsersController } from "../../controllers/users";
import { extractPageData } from "../../utils/shapes/extract-page-data";
import { fetchPageIssues } from "./fetch-issues";
import { ResponseModel } from "../../models/response/types";
import { crawlEmitter, crawlTrackingEmitter } from "../../../event";
import {
  SUPER_MODE,
  SCRIPTS_ENABLED,
  DISABLE_STORE_SCRIPTS,
} from "../../../config/config";
import { findPageActionsByPath } from "../../controllers/page-actions/find";
import { PageSpeedController } from "../../controllers/page-speed/main";
import { validateScanEnabled } from "../../controllers/users/update/scan-attempt";
import { RATE_EXCEEDED_ERROR } from "../../strings";
import { collectionIncrement } from "../../utils/collection-upsert";
import { SCAN_TIMEOUT } from "../../strings/errors";
import { StatusCode } from "../../../web/messages/message";
import type { User, Website } from "../../../types/types";
import type { Issue } from "../../../types/schema";

export type CrawlConfig = {
  userId: number; // user id
  url: string; // the target url to crawl
  pageInsights?: boolean; // use page insights to get info
  sendSub?: boolean; // use pub sub
  user?: User; // optional pass user
  noStore?: boolean; // when enabled - do not store data to fs for js scripts etc
};

// track the crawl events between crawls
const trackerProccess = (
  data: any,
  { domain, urlMap, userId, shutdown = false }: any,
  blockEvent?: boolean
) => {
  process.nextTick(() => {
    if (!blockEvent && data) {
      crawlEmitter.emit(`crawl-${domainName(domain)}-${userId || 0}`, data);
    }
    // determine crawl has been processed top level tracking
    crawlTrackingEmitter.emit("crawl-processed", {
      user_id: userId,
      domain,
      pages: [urlMap],
      shutdown,
    });
  });
};

/**
 * Send to gRPC pagemind request. Stores data upon return into database.
 *
 * Examples:
 *
 *     await crawlPage({ url: "https://a11ywatch.com" });
 *     await crawlPage({ url: "https://a11ywatch.com", sendSub: true }); // send pub sub to front-end client
 *     await crawlPage({ url: "https://a11ywatch.com", userId: 122, pageInsights: true }); // run request with lighthouse
 */
export const crawlPage = async (
  crawlConfig: CrawlConfig,
  sendEmail?: boolean, // determine if email should be sent based on results
  blockEvent?: boolean // block event from emitting
): Promise<ResponseModel> => {
  const { url: urlMap, pageInsights = false, user: usr } = crawlConfig ?? {};
  const sendSub: boolean = crawlConfig?.sendSub ?? true; // detect if redis is connected to send subs
  const userId = usr?.id ?? crawlConfig?.userId;

  // get user role
  const [userData, userCollection] = await UsersController().getUser({
    id: userId,
  });

  const { pageUrl, domain, pathname } = sourceBuild(urlMap, userId);

  // block scans from running
  if (!sendEmail && validateScanEnabled({ user: userData }) === false) {
    trackerProccess(
      undefined,
      { domain, urlMap, userId, shutdown: true },
      blockEvent
    );

    return responseModel({
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

  const freeAccount = !userData?.role || userData?.role == 0; // free account
  const scriptsEnabled = SUPER_MODE ? SCRIPTS_ENABLED : !freeAccount; // scripts for and storing via aws for paid members [TODO: enable if CLI or env var]
  const rootPage = pathname === "/"; // the url is the base domain index.
  const insightsLocked = !SUPER_MODE && (freeAccount || userData?.role === 1);

  let insightsEnabled = false;
  let noStore = crawlConfig.noStore || DISABLE_STORE_SCRIPTS;

  // prevent storage on free accounts js scripts
  if (!SUPER_MODE && !freeAccount) {
    noStore = true;
  }

  if (website?.pageInsights || pageInsights) {
    // only premium and above get lighthouse on all pages.
    if (userData?.pageSpeedApiKey) {
      insightsEnabled = true;
    } else if (insightsLocked) {
      insightsEnabled = rootPage;
    } else {
      insightsEnabled = pageInsights || website?.pageInsights;
    }
  }

  const actions = await findPageActionsByPath({ userId, path: pathname });

  const dataSource = await fetchPageIssues({
    pageHeaders: website?.pageHeaders,
    url: urlMap,
    userId,
    pageInsights: insightsEnabled,
    scriptsEnabled,
    mobile: website?.mobile,
    ua: website?.ua,
    standard: website?.standard,
    actions,
    cv: SUPER_MODE || userData?.role === 2,
    pageSpeedApiKey: userData?.pageSpeedApiKey,
    noStore,
  });

  let shutdown = false;

  if (!SUPER_MODE) {
    const ttime = dataSource?.webPage?.pageLoadTime?.duration || 0;
    const pastUptime = userData?.scanInfo?.totalUptime || 0;
    const totalUptime = ttime + pastUptime;

    // check if scan has shut down
    shutdown =
      validateScanEnabled({
        user: {
          role: userData?.role,
          scanInfo: {
            usageLimit: userData?.scanInfo?.usageLimit,
            totalUptime,
          },
        },
      }) === false;
    await collectionIncrement(
      {
        "scanInfo.totalUptime": ttime, // add new uptime to collection
      },
      userCollection,
      { id: userId }
    ); // User
  }

  // TODO: SET PAGE OFFLINE DB
  if (!dataSource || !dataSource?.webPage) {
    trackerProccess(
      undefined,
      { domain, urlMap, userId, shutdown },
      blockEvent
    );

    return responseModel({
      data: null,
      code: StatusCode.BadRequest,
      success: false,
      message: SCAN_TIMEOUT,
    });
  }

  // TODO: MOVE TO QUEUE
  let {
    script,
    issues: pageIssues,
    webPage,
    adaScore,
    issuesInfo,
    lighthouseData, // page insights
  } = extractPageData(dataSource);

  const [newSite, pagesCollection] = await getPage({
    userId,
    url: pageUrl,
  }); // PAGE COLLECTION

  const [issueExist, issuesCollection] = await IssuesController().getIssue(
    { pageUrl, userId, noRetries: true },
    true
  );

  const [analytics, analyticsCollection] =
    await AnalyticsController().getWebsite({ pageUrl, userId }, true);

  const [pageSpeed, pageSpeedCollection] =
    await PageSpeedController().getWebsite({ pageUrl, userId }, true);

  const newIssue = Object.assign({}, pageIssues, {
    domain,
    userId,
    pageUrl,
  });

  // issues array
  const subIssues: Issue[] = pageIssues?.issues ?? [];
  const pageConstainsIssues = subIssues?.length;

  // // TODO: MERGE ISSUES FROM ALL PAGES
  const updateWebsiteProps: Website = Object.assign({}, webPage, {
    online: true,
    userId,
  });

  let scripts;
  let scriptsCollection;

  // if website record exist update integrity of the data.
  if (website) {
    setImmediate(async () => {
      // if ROOT domain for scan update Website Collection.
      if (rootPage) {
        const { issuesInfo, issues, ...updateProps } = updateWebsiteProps;

        await collectionUpsert(
          updateProps,
          [websiteCollection, !!updateWebsiteProps],
          {
            searchProps: { url: pageUrl, userId },
          }
        );
      }

      // if scripts enabled get collection
      if (scriptsEnabled) {
        [scripts, scriptsCollection] = await ScriptsController().getScript(
          { pageUrl, userId, noRetries: true },
          true
        );

        if (script) {
          script = Object.assign(
            {},
            script,
            { userId },
            {
              scriptMeta: !scripts?.scriptMeta
                ? {
                    skipContentEnabled: true,
                  }
                : scripts.scriptMeta,
            }
          );
        }
      }

      const shouldUpsertCollections = pageConstainsIssues || issueExist; // if issues exist prior or current update collection

      // Add to Issues collection if page contains issues or if record should update/delete.
      if (shouldUpsertCollections) {
        await collectionUpsert(lighthouseData, [
          pageSpeedCollection,
          pageSpeed,
        ]); // PageInsights
        const { issueMeta, ...analyticsProps } = issuesInfo; // todo: remove pluck
        await collectionUpsert(
          Object.assign(
            {},
            {
              pageUrl,
              domain,
              userId,
              adaScore,
            },
            analyticsProps
          ),
          [analyticsCollection, analytics]
        ); // Analytics

        await collectionUpsert(
          newIssue,
          [issuesCollection, issueExist, !pageConstainsIssues],
          {
            searchProps: { pageUrl, userId },
          }
        ); // Issues
      }

      // Pages
      if ((!newSite && shouldUpsertCollections) || newSite) {
        await collectionUpsert(
          updateWebsiteProps,
          [pagesCollection, newSite, !pageConstainsIssues], // delete collection if issues do not exist
          {
            searchProps: { url: pageUrl, userId },
          }
        );
      }

      // Add script to collection
      if (scriptsEnabled) {
        await collectionUpsert(script, [scriptsCollection, scripts]);
      }
    });
  }

  // Flatten issues with the array set results without meta.
  const responseData = {
    data: Object.assign({}, updateWebsiteProps, { issues: subIssues }),
  };

  if (pageConstainsIssues) {
    sendSub &&
      setImmediate(async () => {
        try {
          await pubsub.publish(ISSUE_ADDED, { issueAdded: newIssue });
        } catch (_) {
          // silent pub sub errors
        }
      });

    // send email if issues of type error exist for the page. TODO: remove from layer.
    if (sendEmail && issuesInfo?.errorCount) {
      await emailMessager.sendMail({
        userId,
        data: Object.assign({}, pageIssues, { issuesInfo }), // todo: use response data
        confirmedOnly: true,
        sendEmail: true,
      });
    }
  }

  if (!blockEvent) {
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
  }

  return responseModel(responseData);
};

async function* entriesFromWebsite(
  pages: string[],
  userId: number
): AsyncGenerator<[ResponseModel, string]> {
  for (const url of pages) {
    yield [await crawlPage({ url, userId }, false), url];
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
