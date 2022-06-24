import { WEBSITE_EXIST_ERROR, SUCCESS } from "@app/core/strings";
import { getLastItemInCollection } from "@app/core/utils";
import { getPage } from "../find";

export const addDomain = async ({ userId, url }) => {
  const [siteExist, collection] = await getPage({ userId, url }, true);

  if (siteExist) {
    throw new Error(WEBSITE_EXIST_ERROR);
  }

  const lastItem = await getLastItemInCollection(collection, userId);

  const website = {
    userId,
    id: lastItem?.length && lastItem[0] ? lastItem[0].id + 1 : 0,
    url,
  };

  await collection.insertOne(website);

  return { website, code: 200, success: true, message: SUCCESS };
};
