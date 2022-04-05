import { getHostName } from "@a11ywatch/website-source-builder";
import { connect } from "@app/database";

// get the page report
export const getReport = async (
  pageUrl: string,
  timestamp?: string | number
) => {
  if (!pageUrl) {
    return { website: undefined };
  }
  try {
    // TODO: GET authed user
    const [domainCollection] = await connect("SubDomains");
    const [collection] = await connect("Issues");

    const domain = getHostName(pageUrl);

    const findBy = {
      domain,
    };

    const websiteFindBy = timestamp
      ? {
          ...findBy,
          lastScanDate: undefined,
        }
      : findBy;

    // TODO: ADD USER_ID AND TIMESTAMP
    const website = await domainCollection.findOne(websiteFindBy);
    const websiteIssues = await collection.findOne(findBy);

    if (website && websiteIssues) {
      if (websiteIssues.issues) {
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
