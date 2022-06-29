/*
 * Return data formatted for graphQL. Reshapes API data to gql. TODO: move layers
 * Reshapes issues to issue. TODO: consistent names.
 */
const websiteFormatter = (source: any) => {
  const { data, website, ...rest } = source;

  const webPage = data ? data : website;

  // pluck issues from respone [TODO: shape gql issues]
  const { issues, ...websiteData } = webPage;

  if (websiteData) {
    // remap to issue to prevent gql resolver gql 'issues'
    if (issues) {
      websiteData.issue = issues;
    }

    // flatten issues to to [issue] field that returns Issue directly.
    if (websiteData?.issue && "issues" in websiteData.issue) {
      websiteData.issue = websiteData?.issue.issues;
    }
  }

  return {
    website: websiteData,
    ...rest,
  };
};

export { websiteFormatter };
