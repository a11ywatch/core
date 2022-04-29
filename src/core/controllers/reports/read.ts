import { getHostName } from "@a11ywatch/website-source-builder";
import { connect } from "@app/database";

const findSort = { sort: { $natural: -1 } };

// get the page report for a website.
export const getReport = async (
  pageUrl: string,
  timestamp?: string | number
) => {
  if (!pageUrl) {
    return { website: undefined };
  }
  try {
    // TODO: GET authed user
    const [domainCollection] = await connect("Websites");
    const [collection] = await connect("Issues");

    const domain = getHostName(pageUrl);

    const findBy = {
      domain,
    };

    const websiteFindBy = timestamp
      ? {
          lastScanDate: new Date(timestamp),
          ...findBy,
        }
      : findBy;

    // TODO: ADD USER_ID AND TIMESTAMP
    const website = await domainCollection.findOne(websiteFindBy, findSort);

    if (website) {
      // find the issues for the website page
      const issuesFindBy = timestamp
        ? {
            lastScanDate: new Date(timestamp),
            pageUrl: website.url,
          }
        : { pageUrl: website.url };
      const websiteIssues = await collection.findOne(issuesFindBy, findSort);
      if (websiteIssues && websiteIssues.issues) {
        website.issues = websiteIssues.issues ?? [];
      }
    }

    return {
      website,
    };
  } catch (e) {
    console.error(e);
  }
};
