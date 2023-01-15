import type { Issue } from "../../../types/types";

// limit the issue records to 1/4th todo: pre-allocate
// @return Issue['issues'][]
export const limitIssue = ({ issues }: Issue) => {
  if (!issues.length) {
    return [];
  }

  const half = Math.ceil(issues.length / 2);

  const tlist = issues.slice(0, half);
  const blist = issues.slice(half);

  const top = tlist.slice(
    tlist.length - Math.max(Math.round(tlist.length / 4), 2)
  );

  const bottom = blist.slice(
    blist.length - Math.max(Math.round(blist.length / 4), 2)
  );

  return [...top, ...bottom];
};
