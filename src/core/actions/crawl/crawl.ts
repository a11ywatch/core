import { emailMessager } from "@app/core/messagers";
import { sourceBuild } from "@a11ywatch/website-source-builder";
import { pubsub } from "@app/database/pubsub";
import { SUBDOMAIN_ADDED, ISSUE_ADDED } from "@app/core/static";
import { responseModel } from "@app/core/models";
import { collectionUpsert } from "@app/core/utils";
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

export type CrawlConfig = {
  userId: number; // user id
  url: string;
  pageInsights?: boolean; // use page insights to get info
  sendSub?: boolean; // use pub sub
};

// filter errors from issues
const filterCb = (iss: Issue) => iss?.type === "error";

// crawl the url for issues and update collection records
export const crawlPage = async (
  crawlConfig: CrawlConfig,
  sendEmail?: boolean // determine if email should be sent based on results
) => {
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

      if (website?.pageInsights || pageInsights) {
        if (freeAccount) {
          // INSIGHTS ONLY ON ROOT PAGE IF ENABLED
          insightsEnabled = pathname === "/";
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
      });

      // TODO: SET PAGE OFFLINE DB
      if (!dataSource || !dataSource?.webPage) {
        return resolve(
          responseModel({ website: null, code: 300, success: false })
        );
      }

      // re-assign to key of json for backwords compat TODO: GET DATA AS JSON
      if (dataSource?.webPage?.insight) {
        dataSource.webPage.insight = JSON.parse(
          dataSource.webPage.insight as any
        );
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

      const subIssues: Issue[] = pageIssues?.issues ?? [];
      const pageConstainsIssues = subIssues?.length;

      if (pageConstainsIssues) {
        if (sendSub) {
          await pubsub.publish(ISSUE_ADDED, { issueAdded: newIssue });
        }

        if (sendEmail && subIssues.some(filterCb)) {
          const errorIssues = subIssues.filter(filterCb);
          // TODO: queue email
          await emailMessager.sendMail({
            userId,
            data: { ...pageIssues, issues: errorIssues },
            confirmedOnly: true,
          });
        }
      }

      // // TODO: MERGE ISSUES FROM ALL PAGES
      const updateWebsiteProps: Website = Object.assign({}, webPage, {
        online: true,
        userId,
      });

      // new Page found send pub sub
      if (webPage && !newSite && sendSub) {
        await pubsub.publish(SUBDOMAIN_ADDED, {
          subDomainAdded: updateWebsiteProps,
        });
      }

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

      // TODO: REMOVE UPDATING WEBSITE DATA FROM BASE
      if (pathname === "/") {
        await collectionUpsert(
          updateWebsiteProps,
          [websiteCollection, !!updateWebsiteProps],
          {
            searchProps: { url: pageUrl, userId },
          }
        );
      }

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
        !pageConstainsIssues,
      ]); // ISSUES COLLECTION

      if (scriptsEnabled) {
        await collectionUpsert(script, [scriptsCollection, scripts]); // SCRIPTS COLLECTION
      }

      await collectionUpsert(
        updateWebsiteProps,
        [subDomainCollection, newSite],
        {
          searchProps: { pageUrl, userId },
        }
      ); // pages - sub domains needs rename

      // if flat api return source
      const responseData = {
        data: Object.assign({}, website, updateWebsiteProps, {
          issues: newIssue,
        }),
      };

      return resolve(responseModel(responseData));
    } catch (e) {
      console.error(e);
    }
    return resolve(responseModel());
  });
};
