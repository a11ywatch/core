import { getWebsitesWithUsers } from "@app/core/controllers/websites";

// [Internal] method to cleanup invalid domain adds
export const cleanUpInvalidWebsite = async () => {
  let allWebPages = [];
  let collection;

  try {
    // TODO: recursive paginate 20 batch
    [allWebPages, collection] = await getWebsitesWithUsers(0);
  } catch (e) {
    console.error(e);
  }

  const colMap = {};
  allWebPages.forEach(async (item) => {
    // remove duplicates
    if (colMap[item.url]) {
      await collection.findOneAndDelete({ url: item.url });
    } else {
      colMap[item.url] = true;
    }
  });
};
