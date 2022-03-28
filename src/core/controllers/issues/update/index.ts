import { getIssue } from "../find";

export const updateIssues = async ({ userId, url, issuesCount, issues }) => {
  const [siteExist, collection] = await getIssue({ userId, url }, true);

  const issue = {
    ...siteExist,
    issuesCount: issuesCount || issues.count,
    issues,
  };

  await collection.updateOne(
    { url, userId },
    { $set: { issuesCount, issues } }
  );

  return issue;
};
