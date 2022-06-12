import { UsersController } from "../controllers/users";
import { IssuesController } from "../controllers/issues";
import { PagesController } from "../controllers/pages";
import { ScriptsController } from "../controllers/scripts";
import { AnalyticsController } from "../controllers";
import { getPageActionsPaging } from "../controllers/page-actions/page-actions";

export const Website = {
  user: async ({ userId }) => {
    const [user] = await UsersController().getUser({ id: userId });

    return user;
  },
  issues: async ({ userId, url, pageUrl }, { filter }) => {
    const issues = await IssuesController().getIssues({
      userId,
      pageUrl: decodeURIComponent(url || pageUrl),
      filter,
    });

    if (filter && issues && ["error", "notice", "warning"].includes(filter)) {
      return issues.filter((item) => {
        if (item?.issues) {
          item.issues = item?.issues?.filter((issue) => issue?.type === filter);
        }

        return item?.issues?.length ? item : null;
      });
    }

    return issues;
  },
  // find one script for a page -- TODO: move to pages
  script: async ({ userId, url, pageUrl }) => {
    return await ScriptsController().getScript(
      { userId: userId, pageUrl: url || pageUrl },
      false
    );
  },
  scripts: async ({ userId, domain }) => {
    return await ScriptsController().getWebsiteScripts({
      userId: userId,
      domain,
    });
  },
  analytics: async ({ userId, domain }) => {
    // get analytics for one website
    return await AnalyticsController().getWebsiteAnalytics({
      userId,
      domain,
    });
  },
  // TODO rename
  pages: async ({ userId, url, domain }) => {
    return await PagesController().getDomains({
      userId,
      url,
      domain,
    });
  },
  actions: async ({ userId, domain }, params) => {
    return await getPageActionsPaging({
      userId,
      domain,
      ...params,
    });
  },
};
