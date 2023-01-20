import { UsersController } from "../controllers/users";
import { IssuesController } from "../controllers/issues";
import { PagesController } from "../controllers/pages";
import { AnalyticsController } from "../controllers";
import { getPageActionsPaging } from "../controllers/page-actions/page-actions";
import { PageSpeedController } from "../controllers/page-speed/main";

export const Website = {
  user: async ({ userId }) => {
    const [user] = await UsersController().getUser({ id: userId });

    return user;
  },
  issues: async ({ userId, url, pageUrl }, params) => {
    const { filter, ...pagination } = params;

    const issues = await IssuesController().getIssuesPaging({
      userId,
      pageUrl: url || pageUrl,
      ...pagination,
    });

    // TODO: move to DB.
    if (
      filter &&
      Array.isArray(issues) &&
      ["error", "notice", "warning"].includes(filter)
    ) {
      return issues.filter((item) => {
        if (item?.issues) {
          item.issues = item?.issues?.filter((issue) => issue?.type === filter);
        }
        return item?.issues?.length ? item : null;
      });
    }

    return issues;
  },
  analytics: async ({ userId, domain }, params) => {
    return await AnalyticsController().getAnalyticsPaging({
      userId,
      domain,
      ...params,
    });
  },
  pages: async ({ userId, url, domain, insights = false }, params) => {
    return await PagesController().getPagesPaging({
      userId,
      url,
      domain,
      insights, // todo: if enabled rate limit weighted
      ...params,
    });
  },
  actions: async ({ userId, domain }, params) => {
    return await getPageActionsPaging({
      userId,
      domain,
      ...params,
    });
  },
  insight: async ({ userId, domain, url }, _params) => {
    return await PageSpeedController().getWebsitePageSpeed({
      userId,
      domain,
      pageUrl: url,
    });
  },
};
