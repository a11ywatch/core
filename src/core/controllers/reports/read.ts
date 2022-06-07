import { SUPER_MODE } from "@app/config/config";
import { connect } from "@app/database";
import { URL } from "url";

// get the page report for a website. TODO: REFACTOR..
export const getReport = async (url: string, userId?: number) => {
  if (!url) {
    return { website: undefined };
  }
  const authenticated = typeof userId !== "undefined";
  let website; // TODO: return as `data`
  let domain;
  let targetPages = false; // collection targetting

  try {
    // get host name from url
    const { pathname, hostname } = new URL(url);
    if (pathname !== "/") {
      targetPages = true;
    }
    domain = hostname;
  } catch (e) {
    console.error(e);
  }

  let findBy = {};
  let websiteFindBy = {};
  let pageCollection = "";

  if (targetPages) {
    findBy = { url };
    pageCollection = "Pages";
  } else {
    findBy = { domain };
    pageCollection = "Websites";
  }

  if (authenticated) {
    websiteFindBy = {
      ...findBy,
      userId,
    };
  } else {
    websiteFindBy = {
      ...findBy,
    };
  }

  // if no keys exit
  if (!Object.keys(websiteFindBy).length) {
    return {
      website: null,
    };
  }

  const [issueCollection] = await connect("Issues");
  const [domainCollection] = await connect(pageCollection);

  try {
    website = await domainCollection.findOne(websiteFindBy);
  } catch (e) {
    console.error(e);
  }

  // find the issues for the website page
  if (website) {
    try {
      const websiteIssues = await issueCollection.findOne({
        pageUrl: website.url,
      });

      if (websiteIssues && websiteIssues.issues) {
        website.issues = websiteIssues.issues;
      }

      // remove google lighthouse data from request [PREVENT ALL AUTH DATA FROM BEING SENT]
      if (!authenticated && !SUPER_MODE) {
        website.insight = undefined;
        website.pageHeaders = undefined;
        website.ua = undefined;
        website.userId = undefined;
      }
    } catch (e) {
      console.error(e);
    }
  }

  return {
    website,
  };
};
