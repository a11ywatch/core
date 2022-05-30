import { getPayLoad } from "../../utils/query-payload";

export const issue = async (_, { url: pageUrl, ...props }, context) => {
  const userId = getPayLoad(context, props)?.userId;

  return await context.models.Issue.getIssue({
    userId,
    pageUrl,
  });
};
export const issues = async (_, { url: pageUrl, ...props }, context) => {
  const userId = getPayLoad(context, props)?.userId;

  return await context.models.Issue.getIssues({
    userId,
    pageUrl: decodeURIComponent(pageUrl),
  });
};
