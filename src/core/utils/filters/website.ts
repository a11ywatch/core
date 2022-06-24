import { domainNameFind } from "../domain-name";

export function websiteSearchParams({
  userId,
  url,
  pageUrl,
  domain,
}: {
  userId?: any;
  url?: string;
  pageUrl?: string;
  domain?: string;
}) {
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
    searchProps = domainNameFind(searchProps, domain);
  }

  return searchProps;
}
