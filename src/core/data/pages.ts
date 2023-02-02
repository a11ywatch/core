import { AnalyticsController } from "../controllers";
import { IssuesController } from "../controllers/issues";

export const Pages = {
  issues: async ({ userId, url }) => {
    const issueItem = await IssuesController().getIssue({
      id: userId,
      url,
    });
    return issueItem?.issues;
  },
  issuesInfo: async ({ userId, url }, _params) =>
    await AnalyticsController().getWebsite({
      userId,
      pageUrl: url,
    }),
};
