import { getIssue } from "../find";
import { SUCCESS } from "@app/core/strings";

export const addIssue = async ({ userId, url, issue }: any) => {
  const [issueExist, collection] = await getIssue({ userId, url }, true);

  if (!issueExist) {
    const id = await collection.countDocuments({ userId, url });

    const newIssue = {
      userId,
      issue,
      id,
      url,
    };

    await collection.insertOne(newIssue);
  }

  return { code: 200, success: true, message: SUCCESS };
};
