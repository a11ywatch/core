import { connect } from "@app/database";
import { URL } from "url";

const findSort = { sort: { $natural: -1 } };

// get the page report for a website. TODO: REFACTOR and get auth user for report
export const getReport = async (url: string, timestamp?: string | number) => {
  if (!url) {
    return { website: undefined };
  }
  let website; // TODO: return as `data`
  let domain;
  let targetPages = false;

  try {
    const urlTarget = new URL(url);
    domain = urlTarget.hostname;

    if (urlTarget.pathname !== "/") {
      targetPages = true;
    }
  } catch (e) {
    console.error(e);
  }

  // not base path -> target SubDomains(Pages)
  if (targetPages) {
    try {
      const [domainCollection] = await connect("SubDomains");
      const [collection] = await connect("Issues");

      const findBy = {
        url,
      };

      const websiteFindBy = timestamp
        ? {
            lastScanDate: new Date(timestamp),
            ...findBy,
          }
        : findBy;

      // TODO: ADD USER_ID AND TIMESTAMP
      website = await domainCollection.findOne(websiteFindBy, findSort);

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
    } catch (e) {
      console.error(e);
    }
  } else {
    try {
      const [domainCollection] = await connect("Websites");
      const [collection] = await connect("Issues");

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
      website = await domainCollection.findOne(websiteFindBy, findSort);

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
    } catch (e) {
      console.error(e);
    }
  }

  return {
    website,
  };
};
