import { IssuesController } from "../controllers/issues";

export const Pages = {
  issues: async ({ userId, url }) => {
    const issueItem = await IssuesController().getIssue({
      id: userId,
      url,
    });
    return issueItem?.issues;
  },
};
