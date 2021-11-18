/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/
import { UsersController } from "../controllers/users";
import { IssuesController } from "../controllers/issues";
import { SubDomainController } from "../controllers/subdomains";
import { ScriptsController } from "../controllers/scripts";

export const Website = {
  user: async ({ userId }) => {
    return await UsersController().getUser({ id: userId }, false);
  },
  issues: async ({ userId, url, pageUrl }, { filter }) => {
    let issues = await IssuesController().getIssues({
      userId,
      pageUrl,
      url,
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
