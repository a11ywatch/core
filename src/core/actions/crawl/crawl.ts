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
import { getDomain } from "@app/core/controllers/subdomains/find";
import type { Website } from "@app/types";
import { UsersController } from "@app/core/controllers/users";
import { Issue } from "@app/schema";
import { extractPageData } from "./extract-page-data";
import { fetchPageIssues } from "./fetch-issues";
import { ResponseModel } from "@app/core/models/response/types";
import type { Struct } from "pb-util";

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
    try {
      const { pageUrl, domain, pathname } = sourceBuild(urlMap, userId);
      const [userData] = await UsersController().getUser({ id: userId });
      // WEBSITE COLLECTION
      const [website, websiteCollection] = await getWebsite({
        domain,
        userId,
      });
      let insightsEnabled = false;

      const freeAccount = !userData?.role; // free account
      const scriptsEnabled = !freeAccount; // scripts for and storing via aws for paid members [TODO: enable if CLI or env var]
      const rootPage = pathname === "/"; // the url is the base domain index.

      if (website?.pageInsights || pageInsights) {
        if (freeAccount) {
          // INSIGHTS ONLY ON ROOT PAGE IF ENABLED
          insightsEnabled = rootPage;
        } else {
          insightsEnabled = pageInsights || website?.pageInsights;
        }
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
      });

      // TODO: SET PAGE OFFLINE DB
      if (!dataSource || !dataSource?.webPage) {
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
        errorCount,
        noticeCount,
        warningCount,
        adaScore,
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

      // if ROOT domain for scan update Website Collection.
      if (rootPage) {
        await collectionUpsert(
          updateWebsiteProps,
          [websiteCollection, !!updateWebsiteProps],
          {
            searchProps: { url: pageUrl, userId },
          }
        );
      }

      const shouldUpsertCollections = pageConstainsIssues || issueExist;

      // Add to Issues collection if page contains issues or if record should update/delete.
      if (shouldUpsertCollections) {
        await collectionUpsert(
          {
            pageUrl,
            domain,
            errorCount,
            warningCount,
            noticeCount,
            userId,
            adaScore,
          },
          [analyticsCollection, analytics]
        ); // ANALYTICS
        await collectionUpsert(newIssue, [
          issuesCollection,
          issueExist,
          !pageConstainsIssues, // delete collection if issues do not exist
        ]); // ISSUES COLLECTION
      }

      if (shouldUpsertCollections || newSite) {
        await collectionUpsert(
          updateWebsiteProps,
          [subDomainCollection, newSite, !pageConstainsIssues], // delete collection if issues do not exist
          {
            searchProps: { pageUrl, userId },
          }
        ); // pages - sub domains needs rename
      }

      // every page gets a script ATM. TODO conditional scripts.
      if (scriptsEnabled) {
        await collectionUpsert(script, [scriptsCollection, scripts]); // SCRIPTS COLLECTION
      }

      // Flatten issues with the array set results without meta.
      const responseData = {
        data: Object.assign({}, website, updateWebsiteProps, {
          issues: subIssues,
        }),
      };

      return resolve(responseModel(responseData));
    } catch (e) {
      console.error(e);
    }
    return resolve(responseModel());
  });
};
