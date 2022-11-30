/*
 * Return data formatted for graphQL. Reshapes API data to gql. TODO: move layers
 * Reshapes issues to issue. TODO: consistent names.
 */
const websiteFormatter = (source: any) => {
  const { data, website, ...rest } = source;

  const webPage = data ? data : website;

  // pluck issues from respone [TODO: shape gql issues]
  const { issues, ...websiteData } = webPage ?? {};

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

/*
 * Return data formatted for consumption.
 * Reshapes and makes sure issues are flat.
 */
const websiteShape = (source: any) => {
  let website;

  if ("website" in source) {
    website = source?.website;
  }

  if (!website && "data" in source) {
    if (source?.data?.website) {
      website = source?.data?.website;
    } else {
      website = source?.data;
    }
  }

  // pluck issues from respone [TODO: shape gql issues]
  const { issues, ...websiteData } = website;

  if (websiteData) {
    // remap to issue to prevent gql resolver gql 'issues'
    if ("issues" in issues) {
      websiteData.issues = issues.issues;
    } else {
      websiteData.issues = issues;
    }
  }

  return {
    ...source,
    website: websiteData,
  };
};

export { websiteFormatter, websiteShape };
