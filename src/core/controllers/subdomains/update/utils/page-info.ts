/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

export const collectPageInfo = async ({ allDomains }) => {
  //   const getAvgAdaScore = allDomains
  //     .filter((subd) => subd?.adaScore)
  //     .map((fDomain) => fDomain?.adaScore);

  console.log(allDomains);

  try {
    // if (allWebSites?.length) {
    //   await websiteCollection.updateOne(
    //     { domain, userId },
    //     {
    //       $set: {
    //         adaScore: avgScore,
    //         pageLoadTimeAverage: pageLoadTime,
    //         online: true,
    //       },
    //     }
    //   );
    // }
  } catch (e) {
    console.error(e);
  }
};
