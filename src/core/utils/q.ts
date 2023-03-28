// build the params for the query
export const buildQueryParams = ({
  userId,
  pageUrl,
  url,
  domain,
}: {
  userId?: number;
  pageUrl?: string;
  url?: string;
  domain?: string;
}) => {
  let queryParams = {};

  if (typeof userId !== "undefined") {
    queryParams = { userId };
  }
  if (pageUrl) {
    queryParams = { ...queryParams, pageUrl };
  }
  if (url && !pageUrl) {
    queryParams = { ...queryParams, url };
  }
  if (domain) {
    queryParams = { ...queryParams, domain };
  }
  return queryParams;
};
