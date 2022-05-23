import { getWebsitesWithUsers } from "@app/core/controllers/websites";
import { connect } from "@app/database";

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

// [Internal] method to cleanup invalid domain adds & params fields to remove { html : "" }
export const cleanUpDeprecatedFields = async (fields) => {
  if (!fields) {
    return Promise.reject(
      "Fields requires a object with properties to remove."
    );
  }
  const [collection] = await connect("SubDomains");
  const [websiteCollection] = await connect("Websites");

  try {
    await collection.updateMany({}, { $unset: fields });
  } catch (e) {
    console.error(e);
  }

  try {
    await websiteCollection.updateMany({}, { $unset: fields });
  } catch (e) {
    console.error(e);
  }
};
