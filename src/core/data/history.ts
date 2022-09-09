import { IssuesController } from "../controllers/issues";
import { PagesController } from "../controllers/pages";

export const History = {
  issues: async ({ userId, url }, { filter }) => {
    const issues = await IssuesController().getIssues({
      userId,
      pageUrl: decodeURIComponent(url),
      // filter,
    });
    if (["error", "notice", "warning"].includes(filter) && issues?.length) {
      const newIssues = issues.filter((item) => {
        item.issues = item.issues.filter((issue) => issue.type === filter);
        if (item.issues.length) {
          return item;
        }
        return null;
      });
      return newIssues;
    }
    return issues;
  },
  pages: async ({ userId, url, domain }) => {
    return await PagesController().getPages({
      userId,
      url,
      domain,
    });
  },
};
