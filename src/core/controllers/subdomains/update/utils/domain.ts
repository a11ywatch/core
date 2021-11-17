/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import { arrayAverage } from "@app/core/utils";
import { getDomains } from "../../find";
// import { collectPageInfo } from "./page-info";

export const generateWebsiteAverage = async ({
  domain,
  perfectScore,
  userId,
  allDomains: allDomainsList,
}: {
  domain?: string;
  perfectScore?: boolean;
  userId?: number;
  allDomains?: any[];
}) => {
  try {
    // TODO: OVERALL SCORE COLLECTION
    // if (webPage) {
    //   [allWebSites, websiteCollection] = await getWebsitesCrawler(
    //     {
    //       domain,
    //       userId,
    //     },
    //     true
    //   );
    // }
    const allDomains = allDomainsList?.length
      ? allDomainsList
      : await getDomains({
          domain,
          userId,
        });
    const getAvgAdaScore = allDomains
      .filter((subd) => subd?.adaScore)
      .map((fDomain) => fDomain?.adaScore);
    const averageItems = arrayAverage(getAvgAdaScore);
    const avgScore = isNaN(averageItems) || perfectScore ? 100 : averageItems;

    return avgScore;
  } catch (e) {
    console.error(e);
    return 0;
  }
};

export const generateWebsiteAverageIssues = async ({ domain, userId }) => {
  try {
    const allDomains = await getDomains({
      domain,
      userId,
    });
    const averageIssues = await generateWebsiteAverage({
      domain,
      userId,
      allDomains,
    });
    // const collectivePageInfo = await collectPageInfo(allDomains);

    return [averageIssues];
  } catch (e) {
    console.error(e);
  }
};
