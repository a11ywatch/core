import { domainNameFind } from "../domain-name";

interface SearchProps {
  userId?: any;
  url?: string;
  pageUrl?: string;
  domain?: string;
  all?: boolean; // query subdomains and tlds into one.
}

export function websiteSearchParams({
  userId,
  url,
  pageUrl,
  domain,
  all = true,
}: SearchProps): SearchProps {
  let searchProps = {};

  if (typeof userId !== "undefined") {
    searchProps = {
      userId,
    };
  }

  if (typeof url !== "undefined" && url) {
    searchProps = { ...searchProps, url };
  }
  if (typeof pageUrl !== "undefined" && pageUrl) {
    searchProps = { ...searchProps, pageUrl };
  }
  if (typeof domain !== "undefined" && domain) {
    if (all) {
      searchProps = domainNameFind(searchProps, domain);
    } else {
      searchProps = { ...searchProps, domain };
    }
  }

  return searchProps;
}
