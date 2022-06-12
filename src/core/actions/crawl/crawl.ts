import { emailMessager } from "@app/core/messagers";
import { sourceBuild } from "@a11ywatch/website-source-builder";
import { pubsub } from "@app/database/pubsub";
import { ISSUE_ADDED } from "@app/core/static";
import { responseModel } from "@app/core/models";
import { collectionUpsert, jsonParse } from "@app/core/utils";
import { IssuesController } from "@app/core/controllers/issues";
import { ScriptsController } from "@app/core/controllers/scripts";
import { getWebsite } from "@app/core/controllers/websites";
import { AnalyticsController } from "@app/core/controllers/analytics";
import { getDomain } from "@app/core/controllers/pages/find";
import { UsersController } from "@app/core/controllers/users";
import { extractPageData } from "./extract-page-data";
import { fetchPageIssues } from "./fetch-issues";
import { ResponseModel } from "@app/core/models/response/types";
import { crawlEmitter, crawlTrackingEmitter } from "@app/event";
import { SUPER_MODE } from "@app/config/config";
import type { Website } from "@app/types";
import type { Issue } from "../../../schema";
import type { Struct } from "pb-util";
import { connect } from "@app/database";

export type CrawlConfig = {
  userId: number; // user id
  url: string; // the target url to crawl
  pageInsights?: boolean; // use page insights to get info
  sendSub?: boolean; // use pub sub
};

// filter errors from issues
const filterCb = (iss: Issue) => iss?.type === "error";

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
  sendEmail?: boolean // determine if email should be sent based on results
): Promise<ResponseModel> => {
  const {
    userId,
    url: urlMap,
    pageInsights = false,
    sendSub = true,
  } = crawlConfig ?? {};

  return new Promise(async (resolve) => {
    const { pageUrl, domain, pathname } = sourceBuild(urlMap, userId);

    const [userData] = await UsersController().getUser({ id: userId });
    // WEBSITE COLLECTION
    const [website, websiteCollection] = await getWebsite({
      domain,
      userId,
    });

    const freeAccount = !userData?.role; // free account
    const scriptsEnabled = !freeAccount; // scripts for and storing via aws for paid members [TODO: enable if CLI or env var]
    const rootPage = pathname === "/"; // the url is the base domain index.
    const insightsLocked = !SUPER_MODE && (freeAccount || userData?.role === 1);

    let insightsEnabled = false;

    if (website?.pageInsights || pageInsights) {
      // only premium and above get lighthouse on all pages.
      if (insightsLocked) {
        insightsEnabled = rootPage;
      } else {
        insightsEnabled = pageInsights || website?.pageInsights;
      }
    }

    let actions;

    try {
      const [actionsCollection] = await connect("PageActions");

      const action = await actionsCollection.findOne({
        path: pathname,
        userId,
      });

      if (action) {
        actions = action.events;
      }
    } catch (e) {
      console.error(e);
    }

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
    });

    const trackerProccess = (data?: any) => {
      crawlTrackingEmitter.emit("crawl-processed", {
        user_id: userId,
        domain,
        pages: [urlMap],
      });

      crawlEmitter.emit(`crawl-${domain}-${userId || 0}`, data);
    };

    // TODO: SET PAGE OFFLINE DB
    if (!dataSource || !dataSource?.webPage) {
      trackerProccess();

      return resolve(
        responseModel({
          data: null,
          code: 300,
          success: false,
          message: "Web site had issues during scan and may be offline.",
        })
      );
    }

    if (dataSource?.webPage?.insight) {
      try {
        // extract data to valid JSON
        dataSource.webPage.insight =
          jsonParse(dataSource.webPage.insight as Struct) ?? undefined;
      } catch (e) {
        console.error(e);
      }
    }

    // TODO: MOVE TO QUEUE
    let {
      script,
      issues: pageIssues,
      webPage,
      adaScore,
      issuesInfo,
    } = extractPageData(dataSource);

    // PAGE COLLECTION
    const [newSite, subDomainCollection] = await getDomain(
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

    const newIssue = Object.assign({}, pageIssues, {
      domain,
      userId,
      pageUrl,
    });

    // issues array
    const subIssues: Issue[] = pageIssues?.issues ?? [];
    const pageConstainsIssues = subIssues?.length;

    if (pageConstainsIssues) {
      if (sendSub) {
        await pubsub.publish(ISSUE_ADDED, { issueAdded: newIssue });
      }

      // send email if issues of type error exist for the page.
      if (sendEmail && subIssues.some(filterCb)) {
        const errorIssues = subIssues.filter(filterCb);
        // TODO: queue email
        await emailMessager.sendMail({
          userId,
          data: { ...pageIssues, issues: errorIssues },
          confirmedOnly: true,
          sendEmail: errorIssues?.length,
        });
      }
    }

    // // TODO: MERGE ISSUES FROM ALL PAGES
    const updateWebsiteProps: Website = Object.assign({}, webPage, {
      online: true,
      userId,
    });

    let scripts;
    let scriptsCollection;

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

    // if website record exist update data the entegrity of the data.
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

      const shouldUpsertCollections = pageConstainsIssues || issueExist;

      // Add to Issues collection if page contains issues or if record should update/delete.
      if (shouldUpsertCollections) {
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
          [subDomainCollection, newSite, !pageConstainsIssues], // delete collection if issues do not exist
          {
            searchProps: { url: pageUrl, userId },
          }
        ); // pages - sub domains needs rename
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

    trackerProccess(responseData);

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
