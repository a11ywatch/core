import { connect } from "../../../../database";
import {
  domainNameFind,
  getHostName,
  websiteSearchParams,
} from "../../../utils";
import { PageSpeedController } from "../../page-speed/main";

// get all pages by url
export const getPages = async (
  { domain, userId, url }: { domain?: string; userId?: number; url?: string },
  chain?: boolean
) => {
  const [collection] = connect("Pages");
  const searchProps = websiteSearchParams({
    userId,
    domain: domain || (url && getHostName(url)),
  });

  try {
    const pages = await collection
      .find(searchProps)
      .sort({ url: 1 })
      .limit(0)
      .toArray();

    return chain ? [pages, collection] : pages;
  } catch (e) {
    console.error(e);
    return chain ? [[], collection] : [];
  }
};

// Get the page from the collection
// @example await getPage({userID: 2}) // returns Pages collection and not Website
export const getPage = async ({
  userId,
  url,
}: {
  userId?: number;
  url?: string;
}) => {
  const [collection] = connect("Pages");
  const searchProps = websiteSearchParams({ url, userId });

  const website = await collection.findOne(searchProps);

  return [website, collection];
};

// get all the pages in the database
export const getAllPages = async () => {
  const [collection] = connect("Pages");

  const websites = await collection.find({}).limit(0).toArray();

  return [websites, collection];
};

// get websites for a user with pagination offsets.
export const getPagesPaging = async (
  {
    userId,
    domain,
    limit = 5,
    offset = 0,
    insights = false,
  }: {
    userId?: number;
    domain?: string;
    limit: number;
    offset: number;
    insights?: boolean;
  },
  chain?: boolean
) => {
  const [collection] = connect("Pages");

  let params = {};

  if (typeof userId !== "undefined") {
    params = { userId };
  }
  if (typeof domain !== "undefined" && domain) {
    params = domainNameFind(params, domain);
  }

  const pages = await collection
    .find(params)
    .skip(offset)
    .limit(limit)
    .toArray();

  // run with insight relationship
  if (insights) {
    for (let i = 0; i < pages.length; i++) {
      const cp = pages[i];

      const { json } =
        (await PageSpeedController().getWebsite({
          userId,
          pageUrl: cp.url,
          domain,
        })) ?? {};
      if (json) {
        pages[i].insight = { json };
      }
    }
  }

  return chain ? [pages, collection] : pages;
};
