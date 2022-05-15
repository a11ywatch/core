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
import { watcherCrawl } from "@app/core/utils/watcher_crawl";

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
}) => {
  const decodedUrl = decodeURIComponent(urlMap);
  // make a clean web url without trailing slashes [TODO: OPT IN to trailing slashes or not]
  const url = stripUrlEndingSlash(initUrl(decodedUrl));
  const domain = getHostName(url);

  if (!domain) {
    throw new Error(WEBSITE_URL_ERROR);
  }

  const [siteExist, collection] = await getWebsite({ userId, url });

  if (siteExist) {
    throw new Error(WEBSITE_EXIST_ERROR);
  }

  const collectionCount = await collection.countDocuments({ userId });
  const [user] = await getUser({ id: userId });

  if (
    blockWebsiteAdd({
      audience: user.role,
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

  const website = makeWebsite({
    userId,
    url,
    domain,
    pageHeaders: customHeaders,
    pageInsights: !!pageInsights,
    mobile,
    ua,
    standard: wcagStandard,
  });

  try {
    await collection.insertOne(website);
  } catch (e) {
    console.error(e);
  }

  if (canScan) {
    // TODO: mobile test
    setImmediate(async () => {
      await watcherCrawl({
        urlMap: url,
        userId,
        scan: true,
      });
    });
  }

  return {
    website,
    code: 200,
    success: !!canScan,
    message: canScan
      ? SUCCESS
      : "Scan limit reached for the day. Upgrade your account or wait until your limit resets tomorrow.",
  };
};
