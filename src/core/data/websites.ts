import { UsersController } from "../controllers/users";
import { IssuesController } from "../controllers/issues";
import { SubDomainController } from "../controllers/subdomains";
import { ScriptsController } from "../controllers/scripts";

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
  script: async ({ userId, url, pageUrl }) => {
    return await ScriptsController().getScript(
      { userId: userId, pageUrl: url || pageUrl },
      false
    );
  },
  subDomains: async ({ userId, url, domain }) => {
    return await SubDomainController().getDomains({
      userId,
      url,
      domain,
    });
  },
};
