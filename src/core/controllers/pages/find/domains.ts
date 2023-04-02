import { pagesCollection } from "../../../../database";
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
  if (!pagesCollection) {
    return chain ? [[], pagesCollection] : [];
  }

  const searchProps = websiteSearchParams({
    userId,
    domain: domain || (url && getHostName(url)),
  });

  try {
    const pages = await pagesCollection
      .find(searchProps)
      .sort({ url: 1 })
      .limit(0)
      .toArray();

    return chain ? [pages, pagesCollection] : pages;
  } catch (e) {
    // console.error(e);
    return chain ? [[], pagesCollection] : [];
  }
};

// Get the page from the collection
// @example await getPage({ userID: 2, url: "http://someurl.com" }) // returns Pages collection and not Website
export const getPage = async ({
  userId,
  url,
}: {
  userId?: number;
  url?: string;
}) => {
  const searchProps = websiteSearchParams({ url, userId });
  const page = pagesCollection && (await pagesCollection.findOne(searchProps));

  return [page, pagesCollection];
};

// get all the pages in the database
export const getAllPages = async () => {
  const websites =
    pagesCollection && (await pagesCollection.find({}).limit(0).toArray());

  return [websites, pagesCollection];
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
  let params = {};

  if (typeof userId !== "undefined") {
    params = { userId };
  }
  if (typeof domain !== "undefined" && domain) {
    params = domainNameFind(params, domain);
  }

  const pages =
    pagesCollection &&
    (await pagesCollection.find(params).skip(offset).limit(limit).toArray());

  // run with insight relationship
  if (pages && insights) {
    for (let i = 0; i < pages.length; i++) {
      const cp = pages[i];

      // if insights not found continue
      if (!cp.pageInsights) {
        continue;
      }

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

  return chain ? [pages, pagesCollection] : pages;
};
