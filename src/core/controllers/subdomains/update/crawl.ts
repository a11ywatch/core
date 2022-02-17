/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import validUrl from "valid-url";
import { emailMessager } from "@app/core/messagers";
import { sourceBuild } from "@a11ywatch/website-source-builder";
import { pubsub } from "@app/core/graph/subscriptions";
import { SUBDOMAIN_ADDED, ISSUE_ADDED, WEBSITE_ADDED } from "@app/core/static";
import { ApiResponse, responseModel } from "@app/core/models";
import { collectionUpsert } from "@app/core/utils";
import { IssuesController } from "../../issues";
import { ScriptsController } from "../../scripts";
import { getWebsite } from "../../websites";
import { AnalyticsController } from "../../analytics";
import { getDomain } from "../find";
import {
  fetchPuppet,
  extractPageData,
  limitResponse,
  generateWebsiteAverageIssues,
} from "./utils";
import { createReport } from "../../reports";
import type { Website } from "@app/types";
import { redisClient } from "@app/database/memory-client";

export const crawlWebsite = async (
  {
    userId: user_id,
    url: urlMap,
    apiData = false,
    parentSub = false,
    pageInsights = false,
  },
  sendEmail?: boolean
) => {
  if (
    !validUrl.isUri(urlMap) ||
    (process.env.NODE_ENV === "production" && urlMap?.includes("localhost:"))
  ) {
    return Promise.resolve(responseModel({ msgType: ApiResponse.NotFound }));
  }
  let userId = user_id;
  let domainSource = sourceBuild(urlMap, userId);
  let domain = domainSource?.domain;
  let pageUrl = domainSource?.pageUrl;
  let authenticated = typeof userId !== "undefined";

  return await new Promise(async (resolve) => {
    try {
      if (typeof userId === "undefined" && redisClient) {
        const memData = await redisClient
          .get(domain)
          .catch((e) => console.error(e));

        if (memData) {
          const memDataParsed = JSON.parse(memData);
          const memKeys = Object.keys(memDataParsed);
          const lastUser = memKeys[memKeys.length - 1];
          userId = lastUser ? Number(lastUser) : undefined;
          authenticated = !!userId;
          domainSource = sourceBuild(urlMap, userId);
          domain = domainSource?.domain;
          pageUrl = domainSource?.pageUrl;
        }
      }

      // CENTRAL WEBSITE COLLECTION
      const [website, websiteCollection] = await getWebsite(
        {
          domain,
          userId,
        },
        true
      );

      const dataSource = await fetchPuppet({
        pageHeaders: website?.pageHeaders,
        url: urlMap,
        userId,
        pageInsights,
      });

      const insight = dataSource?.webPage?.insight;

      if (insight) {
        console.log(["Log insights", insight]);
      }

      if (!dataSource) {
        return resolve(responseModel());
      }

      if (!dataSource?.webPage) {
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
        issues,
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

      const [
        analytics,
        analyticsCollection,
      ] = await AnalyticsController().getWebsite({ pageUrl, userId }, true);

      const [scripts, scriptsCollection] = await ScriptsController().getScript(
        { pageUrl, userId, noRetries: true },
        true
      );

      const newIssue = Object.assign({}, issues, {
        domain,
        userId,
        pageUrl,
      });

      if (issues?.issues?.length) {
        if (parentSub && process.send) {
          process.send({
            name: ISSUE_ADDED,
            key: { name: "issueAdded", value: newIssue },
          });
        } else {
          await pubsub.publish(ISSUE_ADDED, { issueAdded: newIssue });
        }

        const errorIssues = issues?.issues?.filter(
          (iss) => iss?.type === "error"
        );

        if (sendEmail && errorIssues?.length) {
          await emailMessager.sendMail({
            userId,
            data: issues,
            confirmedOnly: true,
          });
        }
      }

      let updateWebsiteProps: Website;

      const [avgScore] = await generateWebsiteAverageIssues({
        domain,
        userId,
      });

      // // TODO: MERGE ISSUES FROM ALL PAGES
      updateWebsiteProps = Object.assign({}, webPage, {
        avgScore,
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
        collectionUpsert(newIssue, [issuesCollection, issueExist]),
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
          if (parentSub && process.send) {
            process.send({
              name: SUBDOMAIN_ADDED,
              key: { name: "subDomainAdded", value: webPage },
            });
          }

          await pubsub
            .publish(SUBDOMAIN_ADDED, {
              subDomainAdded: webPage,
            })
            .catch((e) => console.error(e));
        }
      }

      const websiteAdded = Object.assign({}, website, updateWebsiteProps);

      if (parentSub && process.send) {
        process.send({
          name: WEBSITE_ADDED,
          key: { name: "websiteAdded", value: websiteAdded },
        });
      }

      await pubsub
        .publish(WEBSITE_ADDED, { websiteAdded })
        .catch((e) => console.error(e));

      const responseData = limitResponse({
        issues,
        pageUrl,
        script,
        websiteAdded,
        authenticated,
      }) ?? { data: apiData ? dataSource : websiteAdded };

      const timestamp = new Date().getTime();

      if (responseData?.data) {
        if (responseData?.data?.website) {
          responseData.data.website.timestamp = timestamp;
        } else {
          responseData.data.timestamp = timestamp;
        }
      } else if (responseData.website) {
        responseData.website.timestamp = timestamp;
      }

      const reportData = responseData?.website ?? responseData?.data;

      // TODO: CREATE IN BACKGROUND
      await createReport(reportData, reportData?.issues ?? issues).catch((e) =>
        console.error(e)
      );

      return resolve(responseModel(responseData));
    } catch (e) {
      console.error(e);
      return resolve(responseModel());
    }
  });
};
