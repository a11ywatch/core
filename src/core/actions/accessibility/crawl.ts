import { emailMessager } from "@app/core/messagers";
import { sourceBuild } from "@a11ywatch/website-source-builder";
import { pubsub } from "@app/database/pubsub";
import { ISSUE_ADDED } from "@app/core/static";
import { responseModel } from "@app/core/models";
import { collectionUpsert, domainName } from "@app/core/utils";
import { IssuesController } from "@app/core/controllers/issues";
import { ScriptsController } from "@app/core/controllers/scripts";
import { getWebsite } from "@app/core/controllers/websites";
import { AnalyticsController } from "@app/core/controllers/analytics";
import { getPage } from "@app/core/controllers/pages/find";
import { UsersController } from "@app/core/controllers/users";
import { extractPageData } from "./extract-page-data";
import { fetchPageIssues } from "./fetch-issues";
import { ResponseModel } from "@app/core/models/response/types";
import { crawlEmitter, crawlTrackingEmitter } from "@app/event";
import { SUPER_MODE, SCRIPTS_ENABLED } from "@app/config/config";
import type { User, Website } from "@app/types/types";
import type { Issue } from "../../../types/schema";
import { redisConnected } from "@app/database/memory-client";
import { findPageActionsByPath } from "@app/core/controllers/page-actions/find";
import { PageSpeedController } from "@app/core/controllers/page-speed/main";
import { validateScanEnabled } from "@app/core/controllers/users/update/scan-attempt";
import { RATE_EXCEEDED_ERROR } from "@app/core/strings";
import { collectionIncrement } from "@app/core/utils/collection-upsert";
import { SCAN_TIMEOUT } from "@app/core/strings/errors";
import { StatusCode } from "@app/web/messages/message";

export type CrawlConfig = {
  userId: number; // user id
  url: string; // the target url to crawl
  pageInsights?: boolean; // use page insights to get info
  sendSub?: boolean; // use pub sub
  user?: User; // optional pass user
};

// track the crawl events between crawls
const trackerProccess = (
  data: any,
  { domain, urlMap, userId, shutdown = false }: any,
  blockEvent?: boolean
) => {
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
  const {
    userId,
    url: urlMap,
    pageInsights = false,
    user: usr,
  } = crawlConfig ?? {};

  // detect if redis is connected to send subs
  const sendSub: boolean = redisConnected && (crawlConfig?.sendSub || true);

  let uid;

  if (typeof usr !== "undefined") {
    uid = usr.id;
  } else {
    uid = userId;
  }

  const [userData, userCollection] = await UsersController().getUser({
    id: uid,
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

  return new Promise(async (resolve) => {
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
    });

    let shutdown = false;

    if (!SUPER_MODE) {
      // TODO: add tracking wasting resources that do not exist
      const ttime = dataSource?.webPage?.pageLoadTime?.duration || 0;
      const pastUptime = userData?.scanInfo?.totalUptime || 0;

      const totalUptime = ttime + pastUptime;

      // check if scan has shut down. TODO: remove
      const updatedUser = {
        ...userData,
        scanInfo: {
          ...userData?.scanInfo,
          totalUptime,
        },
      };

      // TODO: remove and use shutdown prior
      shutdown = validateScanEnabled({ user: updatedUser }) === false;

      await collectionIncrement(
        {
          "scanInfo.totalUptime": ttime, // add new uptime to collection
        },
        userCollection,
        { id: userId }
      ); // User COLLECTION
    }

    // TODO: SET PAGE OFFLINE DB
    if (!dataSource || !dataSource?.webPage) {
      trackerProccess(
        undefined,
        { domain, urlMap, userId, shutdown },
        blockEvent
      );

      return resolve(
        responseModel({
          data: null,
          code: StatusCode.BadRequest,
          success: false,
          message: SCAN_TIMEOUT,
        })
      );
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

    // PAGE COLLECTION
    const [newSite, pagesCollection] = await getPage(
      {
        userId,
        url: pageUrl,
      },
      true
    );

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
      // if ROOT domain for scan update Website Collection.
      if (rootPage) {
        const { issuesInfo, ...updateProps } = updateWebsiteProps;

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
          script.userId = userId;
          // TODO: look into auto meta reason
          if (!scripts?.scriptMeta) {
            script.scriptMeta = {
              skipContentEnabled: true,
            };
          }
        }
      }

      const shouldUpsertCollections = pageConstainsIssues || issueExist;

      // Add to Issues collection if page contains issues or if record should update/delete.
      if (shouldUpsertCollections) {
        await collectionUpsert(lighthouseData, [
          pageSpeedCollection,
          pageSpeed,
        ]); // PageInsights

        const { issueMeta, ...analyticsProps } = issuesInfo;
        await collectionUpsert(
          {
            pageUrl,
            domain,
            userId,
            adaScore,
            ...analyticsProps,
          },
          [analyticsCollection, analytics]
        ); // ANALYTICS

        await collectionUpsert(
          newIssue,
          [issuesCollection, issueExist, !pageConstainsIssues],
          {
            searchProps: { pageUrl, userId },
          }
        ); // ISSUES COLLECTION
      }

      if ((!newSite && shouldUpsertCollections) || newSite) {
        await collectionUpsert(
          updateWebsiteProps,
          [pagesCollection, newSite, !pageConstainsIssues], // delete collection if issues do not exist
          {
            searchProps: { url: pageUrl, userId },
          }
        );
      }

      // every page gets a script ATM. TODO conditional scripts.
      if (scriptsEnabled) {
        await collectionUpsert(script, [scriptsCollection, scripts]); // SCRIPTS COLLECTION
      }
    }

    // Flatten issues with the array set results without meta.
    const responseData = {
      data: Object.assign({}, updateWebsiteProps, {
        issues: subIssues,
      }),
    };

    if (pageConstainsIssues) {
      if (sendSub) {
        await pubsub.publish(ISSUE_ADDED, { issueAdded: newIssue });
      }

      // send email if issues of type error exist for the page. TODO: remove from layer.
      if (sendEmail && issuesInfo?.errorCount) {
        await emailMessager
          .sendMail({
            userId,
            data: {
              ...pageIssues,
              issuesInfo,
            },
            confirmedOnly: true,
            sendEmail: true,
          })
          .catch((e) => {
            console.error(e);
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

    return resolve(responseModel(responseData));
  });
};

/*
 * Send request for crawl queue - Sends an email follow up on the crawl data. TODO: remove from file.
 * @return Promise<Websites | Pages>
 */
export const crawlMultiSite = async (data) => {
  const { pages = [], userId: uid, user_id } = data;
  const userId = uid ?? user_id;
  let responseData = [];

  // get users for crawl job matching the urls
  for (const url of pages) {
    let scanResult;
    try {
      scanResult = await crawlPage({ url, userId }, false);
    } catch (e) {
      console.error(e);
    }
    if (scanResult?.data) {
      responseData.push(scanResult.data);
    }
  }

  return responseData;
};
