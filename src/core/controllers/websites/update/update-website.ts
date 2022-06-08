import { WEBSITE_NOT_FOUND, SUCCESS } from "@app/core/strings";
import { connect } from "@app/database";
import { getWebsite } from "../find";

// update a website by properties from form input on adding/
export const updateWebsite = async ({
  userId,
  url,
  pageHeaders,
  pageInsights,
  mobile,
  standard,
  ua,
  actions,
}) => {
  let website;
  let collection;

  try {
    [website, collection] = await getWebsite({ userId, url });
  } catch (e) {
    console.error(e);
  }

  if (!website) {
    throw new Error(WEBSITE_NOT_FOUND);
  }

  const actionsEnabled = actions && Array.isArray(actions) && actions.length;

  // params prior - we mutate this on update
  const pageParams = {
    pageHeaders: website.pageHeaders,
    pageInsights: website?.pageInsights ? true : false,
    mobile: website?.mobile ? true : false,
    standard: website.standard ? website.standard : undefined,
    ua: website.ua ? website.ua : undefined,
    actionsEnabled,
  };

  // if page headers are sent add them
  if (typeof pageHeaders !== "undefined" && Array.isArray(pageHeaders)) {
    const pageHeaderSrc =
      pageHeaders?.length === 1 && !pageHeaders[0].key ? null : pageHeaders;

    pageParams.pageHeaders = pageHeaderSrc;
  }

  // if lighthouse is enabled
  if (typeof pageInsights !== "undefined") {
    pageParams.pageInsights = !!pageInsights;
  }

  // if mobile viewport is enabled
  if (typeof mobile !== "undefined") {
    pageParams.mobile = !!mobile;
  }

  // if standard is set
  if (typeof standard !== "undefined") {
    pageParams.standard = standard;
  }

  // if user agent is defined
  if (typeof ua !== "undefined") {
    pageParams.ua = ua;
  }

  try {
    await collection.updateOne({ url, userId }, { $set: pageParams });
  } catch (e) {
    console.error(e);
  }

  // store into actions collection TODO: validate actions
  if (actionsEnabled) {
    const [actionsCollection] = await connect("PageActions");
    const domain = website.domain;

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

  return {
    website: { ...website, ...pageParams, actions },
    code: 200,
    success: true,
    message: SUCCESS,
  };
};
