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
