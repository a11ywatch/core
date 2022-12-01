import { initUrl } from "@a11ywatch/website-source-builder";
import {
  WEBSITE_EXIST_ERROR,
  ADD_FREE_MAX_ERROR,
  SUCCESS,
  WEBSITE_URL_ERROR,
} from "../../../strings";
import {
  getHostName,
  blockWebsiteAdd,
  stripUrlEndingSlash,
} from "../../../utils";
import { makeWebsite } from "../../../models/website";
import { getWebsite } from "../find";
import { getUser } from "../../users";
import { watcherCrawl } from "../../../actions/accessibility/watcher_crawl";
import { connect } from "../../../../database";
import { SUPER_MODE } from "../../../../config/config";

// allowed standards
const allowedStandards = ["WCAG2A", "WCAG2AA", "WCAG2AAA", "Section508"];

// used on mutations performs a website created following a multi-site scan if enabled
export const addWebsite = async ({
  userId,
  url: urlMap,
  customHeaders,
  // audience,
  canScan,
  pageInsights,
  mobile,
  ua,
  standard,
  actions,
  robots = true,
  subdomains = false,
  tld = false,
}) => {
  const decodedUrl = decodeURIComponent(urlMap);
  // make a clean web url without trailing slashes [TODO: OPT IN to trailing slashes or not]
  const url = stripUrlEndingSlash(initUrl(decodedUrl));
  const domain = getHostName(url);

  if (!domain) {
    throw new Error(WEBSITE_URL_ERROR);
  }

  // TODO: check for tld|subdomains if enabled prevent website addition.
  const [siteExist, collection] = await getWebsite({ userId, url });

  if (siteExist) {
    throw new Error(WEBSITE_EXIST_ERROR);
  }

  const collectionCount = await collection.countDocuments({ userId });
  const [user] = await getUser({ id: userId });

  // user required to add a website
  if (!user) {
    throw new Error("User required to add website.");
  }

  if (
    blockWebsiteAdd({
      audience: user?.role,
      collectionCount,
    })
  ) {
    throw new Error(ADD_FREE_MAX_ERROR);
  }

  let wcagStandard: string | undefined = undefined;

  if (standard && allowedStandards.includes(standard)) {
    wcagStandard = standard;
  }

  const actionsEnabled = actions && Array.isArray(actions) && actions.length;

  const subdomainsEnabled = subdomains && (SUPER_MODE || !!user.role);
  const tldEnabled = tld && (SUPER_MODE || !!user.role);

  const website = makeWebsite({
    userId,
    url,
    domain,
    pageHeaders: customHeaders,
    pageInsights: !!pageInsights,
    mobile,
    ua,
    standard: wcagStandard,
    actionsEnabled,
    robots,
    subdomains: subdomainsEnabled,
    tld: tldEnabled,
  });

  await collection.insertOne(website);

  setImmediate(async () => {
    // store into actions collection
    if (actionsEnabled) {
      const [actionsCollection] = connect("PageActions");

      // add actions to collection
      actions.forEach(async (action) => {
        const update = {
          $set: {
            ...action,
            userId,
            domain,
          },
        };
        const path =
          action.path && action.path[0] === "/"
            ? action.path
            : `/${action.path}`;

        await actionsCollection.updateOne(
          {
            userId,
            domain,
            path,
          },
          update,
          { upsert: true }
        );
      });
    }

    // perform extra scan on mutation. [TODO: add optional input field]
    if (canScan) {
      await watcherCrawl({
        url: url,
        userId,
        robots,
        subdomains: subdomainsEnabled,
        tld: tldEnabled,
        scan: true,
      });
    }
  });

  return {
    website: {
      ...website,
      actions,
    },
    code: 200,
    success: !!canScan,
    message: canScan
      ? SUCCESS
      : "Scan limit reached for the day. Upgrade your account or wait until your limit resets tomorrow.",
  };
};

// wrapper to add website and get results
export const addWebsiteWrapper = async (params) => {
  const { website } = await addWebsite(params);

  if (website) {
    return website;
  }

  return null;
};
