import { connect } from "@app/database";
import { URL } from "url";

// get page actions by domain for a user with pagination offsets.
export const getPageActionsPaging = async (
  {
    userId,
    domain,
    url,
    limit = 100,
    offset = 0,
  }: {
    userId?: number;
    domain?: string;
    limit?: number;
    url?: string;
    offset?: number;
  },
  chain?: boolean
) => {
  try {
    const [collection] = await connect("PageActions");

    let params = {};

    if (typeof userId !== "undefined") {
      params = { userId };
    }
    if (typeof domain !== "undefined" && domain) {
      params = { ...params, domain };
    }
    if (typeof url !== "undefined" && url) {
      let path;

      try {
        path = new URL(url).pathname;
      } catch (_) {}

      params = { ...params, path };
    }

    let items;

    if (Object.keys(params).length) {
      items = await collection.find(params).skip(offset).limit(limit).toArray();
    }

    const pages = items ?? [];

    return chain ? [pages, collection] : pages;
  } catch (e) {
    console.error(e);
  }
};
