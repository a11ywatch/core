import type { Issue } from "../../../types/types";

// limit the issue records to 1/4th
export const limitIssue = (issues: Issue) => {
  return (
    issues?.issues?.slice(
      issues?.issues.length - Math.max(Math.round(issues?.issues.length / 4), 2)
    ) || []
  );
};
