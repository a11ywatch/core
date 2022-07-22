import { WEBSITE_NOT_FOUND } from "@app/core/strings";
import { getIssue } from "../find";

type RemoveProps = {
  userId?: number;
  url?: string;
  deleteMany?: boolean;
};

export const removeIssue = async ({
  userId,
  url,
  deleteMany = false,
}: RemoveProps) => {
  const [siteExist, collection] = await getIssue({ userId, url }, true);

  let deleteMethod = "findOneAndDelete";
  let searchMethod: RemoveProps = { url, userId };

  if (deleteMany) {
    deleteMethod = "deleteMany";
    searchMethod = { userId };
    siteExist.count = await collection.countDocuments(searchMethod);
  }

  if (siteExist) {
    const deleteFullfilled = await collection[deleteMethod](searchMethod);
    if (deleteFullfilled) {
      return siteExist;
    }
  }

  throw new Error(WEBSITE_NOT_FOUND);
};
