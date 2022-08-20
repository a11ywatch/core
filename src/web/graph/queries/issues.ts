import { IssuesController } from "../../../core/controllers";
import { getPayLoad } from "../../../core/utils/query-payload";

// single issue
export const issue = async (_, { url: pageUrl, ...props }, context) => {
  const userId = getPayLoad(context, props)?.userId;

  return await IssuesController().getIssue({
    userId,
    pageUrl: decodeURIComponent(pageUrl),
  });
};

// multiple issues
export const issues = async (_, { url: pageUrl, ...props }, context) => {
  const userId = getPayLoad(context, props)?.userId;

  return await IssuesController().getIssues({
    userId,
    pageUrl: decodeURIComponent(pageUrl),
  });
};
