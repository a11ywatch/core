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

  if (typeof url !== "undefined") {
    searchProps = { ...searchProps, url };
  }
  if (typeof pageUrl !== "undefined") {
    searchProps = { ...searchProps, pageUrl };
  }
  if (typeof domain !== "undefined") {
    searchProps = { ...searchProps, domain };
  }

  return searchProps;
}
