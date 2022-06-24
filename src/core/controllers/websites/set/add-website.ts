import {
  WEBSITE_EXIST_ERROR,
  ADD_FREE_MAX_ERROR,
  SUCCESS,
  WEBSITE_URL_ERROR,
} from "@app/core/strings";
import {
  getHostName,
  blockWebsiteAdd,
  stripUrlEndingSlash,
} from "@app/core/utils";
import { makeWebsite } from "@app/core/models/website";
import { initUrl } from "@a11ywatch/website-source-builder";
import { getWebsite } from "../find";
import { getUser } from "../../users";
import { watcherCrawl } from "@app/core/actions/crawl/watcher_crawl";
import { connect } from "@app/database";

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

  if (!user) {
    throw new Error("Error user not found");
  }

  if (
    blockWebsiteAdd({
      audience: user?.role,
      collectionCount,
      limit: user?.websiteLimit,
    })
  ) {
    throw new Error(ADD_FREE_MAX_ERROR);
  }

  let wcagStandard: string | undefined = undefined;

  if (
    wcagStandard &&
    ["WCAG2A", "WCAG2AA", "WCAG2AAAA"].includes(wcagStandard)
  ) {
    wcagStandard = standard;
  }

  const actionsEnabled = actions && Array.isArray(actions) && actions.length;

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
    subdomains,
    tld,
  });

  try {
    await collection.insertOne(website);
  } catch (e) {
    console.error(e);
  }

  setImmediate(async () => {
    // store into actions collection
    if (actionsEnabled) {
      const [actionsCollection] = await connect("PageActions");

      actions.forEach(async (action) => {
        try {
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
        } catch (e) {
          console.error(e);
        }
      });
    }

    // perform extra scan on mutation. [TODO: add optional input field]
    if (canScan) {
      await watcherCrawl({
        urlMap: url,
        userId,
        scan: true,
        robots,
        subdomains: subdomains && user.role >= 1,
        tld: tld && user.role >= 2,
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
