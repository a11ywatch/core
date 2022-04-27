import type { Issue } from "@app/types";
import { issueSort } from "@app/core/utils";

// limit the issue records
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

// limit the issue records and shape the response API if un-auth
export const limitResponse = ({
  authenticated,
  websiteAdded,
  issues,
  pageUrl,
  script,
}: {
  authenticated: boolean;
  websiteAdded: any;
  issues: any;
  pageUrl: string;
  script: any;
}): any => {
  if (!authenticated) {
    const slicedIssue = limitIssue(issues);

    if (websiteAdded.issuesInfo) {
      websiteAdded.issuesInfo.limitedCount = slicedIssue.length;
    }

    return {
      website: {
        ...websiteAdded,
        url: pageUrl,
        issue: slicedIssue,
        script,
      },
    };
  }
};
