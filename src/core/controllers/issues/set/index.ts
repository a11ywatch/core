import { getIssue } from "../find";
import { SUCCESS } from "../../../../core/strings";

export const addIssue = async ({ userId, url, issue }: any) => {
  const [issueExist, collection] = await getIssue({ userId, url }, true);

  if (!issueExist) {
    const id = await collection.countDocuments({ userId, url });

    await collection.insertOne({
      userId,
      issue,
      id,
      url,
    });
  }

  return { code: 200, success: true, message: SUCCESS };
};
