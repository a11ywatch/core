import { IssuesController } from "../controllers/issues";

export const Issue = {
  // TODO: delete resolver
  issue: async ({ userId, url }) => {
    return await IssuesController().getIssue({
      id: userId,
      url,
    });
  },
};
