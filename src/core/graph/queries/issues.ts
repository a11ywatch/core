import { IssuesController } from "../../controllers";
import { getPayLoad } from "../../utils/query-payload";

// single issue
export const issue = async (_, { url: pageUrl, ...props }, context) => {
  const userId = getPayLoad(context, props)?.userId;

  return await IssuesController().getIssue({
    userId,
    pageUrl: pageUrl,
  });
};

// multiple issues
export const issues = async (_, { url: pageUrl, ...props }, context) => {
  const userId = getPayLoad(context, props)?.userId;

  return await IssuesController().getIssues({
    userId,
    pageUrl: pageUrl,
  });
};
