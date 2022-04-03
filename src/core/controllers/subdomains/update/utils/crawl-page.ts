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
import { getDomain } from "../../find";
import { fetchPuppet, extractPageData, limitResponse } from "./";
import { createReport } from "../../../reports";
import type { Website } from "@app/types";
import { UsersController } from "@app/core/controllers/users";
import { URL } from "url";
import { Issue } from "@app/schema";

export const crawlPage = async (
  { userId, url: urlMap, pageInsights = false, apiData = false },
  sendEmail?: boolean
) => {
  const authenticated = typeof userId !== "undefined";
  // todo: use get hostname
  let domainSource = sourceBuild(urlMap, userId);
  let domain = domainSource?.domain;
  let pageUrl = domainSource?.pageUrl;

  return new Promise(async (resolve) => {
    try {
      const [userData] = await UsersController().getUser({ id: userId });
      // CENTRAL WEBSITE COLLECTION
      const [website, websiteCollection] = await getWebsite({
        domain,
        userId,
      });

      let insightsEnabled = false;
      const freeAccount = !userData?.role;

      // DETERMINE IF INSIGHTS CAN RUN PER USER ROLE
      if (freeAccount) {
        try {
          const urlSource = new URL(pageUrl);
          // ONLY ALLOW INSIGHTS ON ROOT DOMAIN when FREE
          insightsEnabled = urlSource?.pathname === "/";
        } catch (e) {
          console.error(e);
        }
      } else {
        insightsEnabled = pageInsights || website?.pageInsights;
      }

      const dataSource = await fetchPuppet({
        pageHeaders: website?.pageHeaders,
        url: urlMap,
        userId,
        pageInsights: insightsEnabled,
      });

      if (!dataSource) {
        return resolve(responseModel());
      }

      // TODO: UPDATE WESITE ONLINE FLAG
      if (!dataSource?.webPage) {
        // WEBSITE IS OFFLINE
        return resolve({
          website: null,
          code: 300,
          success: false,
          message: `Website timeout exceeded threshhold ${
            authenticated ? "" : "for free scan"
          }, website rendered to slow or does not exist, please check your url and try again`,
        });
      }

      let {
        script,
        issues: pageIssues,
        webPage,
        pageHasCdn,
        errorCount,
        noticeCount,
        warningCount,
        adaScore,
      } = extractPageData(dataSource);

      // CENTRAL PAGE COLLECTION
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

      const [scripts, scriptsCollection] = await ScriptsController().getScript(
        { pageUrl, userId, noRetries: true },
        true
      );

      const newIssue = Object.assign({}, pageIssues, {
        domain,
        userId,
        pageUrl,
      });

      const subIssues: Issue[] = pageIssues?.issues;
      const pageConstainsIssues = subIssues?.length;

      if (pageConstainsIssues) {
        await pubsub.publish(ISSUE_ADDED, { issueAdded: newIssue });

        if (sendEmail && subIssues.some((iss) => iss.type === "error")) {
          await emailMessager.sendMail({
            userId,
            data: pageIssues,
            confirmedOnly: true,
          });
        }
      }

      let updateWebsiteProps: Website;

      // // TODO: MERGE ISSUES FROM ALL PAGES
      updateWebsiteProps = Object.assign({}, webPage, {
        cdnConnected: pageHasCdn,
        online: true,
      });

      if (script) {
        if (!scripts?.scriptMeta) {
          script.scriptMeta = {
            skipContentEnabled: true,
          };
        }
      }

      await Promise.all([
        collectionUpsert(
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
        ),
        collectionUpsert(newIssue, [
          issuesCollection,
          issueExist,
          pageConstainsIssues,
        ]),
        collectionUpsert(updateWebsiteProps, [websiteCollection, website], {
          searchProps: { url: pageUrl, userId },
        }),
        collectionUpsert(script, [scriptsCollection, scripts]),
        collectionUpsert(webPage, [subDomainCollection, newSite], {
          searchProps: { pageUrl, userId },
        }),
      ]).catch((e) => {
        console.error(e);
      });

      if (webPage) {
        if (!newSite) {
          await pubsub
            .publish(SUBDOMAIN_ADDED, {
              subDomainAdded: {
                ...updateWebsiteProps,
                html: "",
              },
            })
            .catch((e) => console.error(e));
        }
      }

      const websiteAdded = Object.assign({}, website, updateWebsiteProps);

      const responseData = limitResponse({
        issues: pageIssues,
        pageUrl,
        script,
        websiteAdded,
        authenticated,
      }) ?? { data: apiData ? dataSource : websiteAdded };

      const timestamp = new Date().getTime();

      // TODO: REMOVE UGLY LOGIC
      if (responseData?.data) {
        if (responseData?.data?.website) {
          responseData.data.website.timestamp = timestamp;
        } else {
          responseData.data.timestamp = timestamp;
        }
      } else if (responseData.website) {
        responseData.website.timestamp = timestamp;
      }

      // TODO: BATCH queue
      const reportData = responseData?.website ?? responseData?.data;

      await createReport(reportData, reportData?.issues ?? pageIssues).catch(
        (e) => console.error(e)
      );

      return resolve(responseModel(responseData));
    } catch (e) {
      console.error(e);
    }
    return resolve(responseModel());
  });
};
