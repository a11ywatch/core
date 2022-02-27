import type { Issue } from "@app/types";
import { issueSort } from "@app/core/utils";

export const limitIssue = (issues: Issue) => {
  return (
    issues?.issues
      ?.slice(
        issues?.issues.length -
          Math.max(Math.round(issues?.issues.length / 4), 2)
      )
      .sort(issueSort) || []
  );
};
