export function websiteSearchParams({
  userId,
  url,
  pageUrl,
  domain,
  filter,
}: {
  userId?: any;
  url?: string;
  pageUrl?: string;
  domain?: string;
  filter?: string;
}) {
  let searchProps = {};

  if (typeof userId !== "undefined") {
    searchProps = {
      userId,
    };
  }

  if (typeof url !== "undefined") {
    searchProps = Object.assign({}, searchProps, { url });
  }
  if (typeof pageUrl !== "undefined") {
    searchProps = Object.assign({}, searchProps, { pageUrl });
  }
  if (typeof domain !== "undefined") {
    searchProps = Object.assign({}, searchProps, { domain });
  }

  return searchProps;
}
