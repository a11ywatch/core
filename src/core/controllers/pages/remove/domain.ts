import {
  SUCCESS,
  SUCCESS_DELETED_ALL,
  WEBSITE_NOT_FOUND,
} from "@app/core/strings";
import { getPage } from "../find";

export const removeDomain = async ({ userId, url, deleteMany = false }) => {
  const [siteExist, collection] = await getPage({ userId, url });

  if (deleteMany) {
    await collection.deleteMany({ userId });
    return { code: 200, success: true, message: SUCCESS_DELETED_ALL };
  }

  if (siteExist) {
    await collection.findOneAndDelete({ url });
    return { website: siteExist, code: 200, success: true, message: SUCCESS };
  }

  throw new Error(WEBSITE_NOT_FOUND);
};
