import { limitIssue } from "./limit-issue";

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
