import validUrl from "valid-url";
import {
  WEBSITE_EXIST_ERROR,
  ADD_FREE_MAX_ERROR,
  SUCCESS,
  WEBSITE_URL_ERROR,
} from "@app/core/strings";
import {
  forkProcess,
  blockWebsiteAdd,
  stripUrlEndingSlash,
} from "@app/core/utils";
import { makeWebsite } from "@app/core/models/website";
import { getHostName, initUrl } from "@a11ywatch/website-source-builder";
import { getWebsite } from "../find";
import { getUser } from "../../users";

export const addWebsite = async ({
  userId,
  url: urlMap,
  customHeaders,
  audience,
  canScan,
  pageInsights,
}) => {
  if (!validUrl.isUri(urlMap)) {
    throw new Error(WEBSITE_URL_ERROR);
  }
  const url = initUrl(urlMap);
  const [siteExist, collection] = await getWebsite({ userId, url });

  if (siteExist) {
    throw new Error(WEBSITE_EXIST_ERROR);
  }

  const collectionCount = await collection.countDocuments({ userId });
  const [user] = await getUser({ id: userId });

  if (
    (user?.websiteLimit && collectionCount === user?.websiteLimit) ||
    blockWebsiteAdd({ audience, collectionCount })
  ) {
    throw new Error(ADD_FREE_MAX_ERROR);
  }

  const website = makeWebsite({
    userId,
    url,
    domain: getHostName(url),
    pageHeaders: customHeaders,
    pageInsights: !!pageInsights,
  });

  await collection.insertOne(website);

  if (canScan) {
    forkProcess({ urlMap: stripUrlEndingSlash(url), userId, scan: true });
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
