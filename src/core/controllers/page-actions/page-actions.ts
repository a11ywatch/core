import { URL } from "url";
import { domainNameFind } from "../../utils";
import { connect } from "../../../database";

// get page actions by domain for a user with pagination offsets.
export const getPageActionsPaging = async (
  {
    userId,
    domain,
    url,
    limit = 20,
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
  const [collection] = connect("PageActions");
  let params = {};

  if (typeof userId !== "undefined") {
    params = { userId };
  }
  if (typeof domain !== "undefined" && domain) {
    params = domainNameFind(params, domain);
  }

  if (typeof url !== "undefined" && url) {
    let path;

    try {
      path = new URL(url).pathname;
    } catch (_) {}

    params = { ...params, path };
  }

  let items = [];

  if (Object.keys(params).length) {
    items = await collection.find(params).skip(offset).limit(limit).toArray();
  }

  const pages = items ?? [];

  return chain ? [pages, collection] : pages;
};
