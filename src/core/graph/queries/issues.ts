import { getPayLoad } from "../../utils/query-payload";

export const issue = async (_, { url: pageUrl, ...props }, context) => {
  return await context.models.Issue.getIssue({
    userId: getPayLoad(context, props),
    pageUrl,
  });
};
export const issues = async (_, { url: pageUrl, ...props }, context) => {
  return await context.models.Issue.getIssues({
    userId: getPayLoad(context, props),
    pageUrl,
  });
};
