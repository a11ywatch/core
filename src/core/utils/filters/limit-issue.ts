import type { Issue } from "../../../types/types";

// limit the issue records to 1/4th
// @return Issue['issues'][]
export const limitIssue = (issues: Issue) => {
  const list =
    issues?.issues && Array.isArray(issues.issues) ? [...issues?.issues] : [];
  const half = Math.ceil(list.length / 2);

  const tlist = list.slice(0, half);
  const blist = list.slice(half);

  const top = tlist.slice(
    tlist.length - Math.max(Math.round(tlist.length / 4), 2)
  );

  const bottom = blist.slice(
    blist.length - Math.max(Math.round(blist.length / 4), 2)
  );

  return [...top, bottom];
};
