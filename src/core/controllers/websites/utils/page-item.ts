import { sourceBuild } from "@a11ywatch/website-source-builder";

export const getPageItem = (item: any): any => {
  const userId = item?.userId;
  const url = item?.url;
  const role = item?.role ?? 0;
  const { domain } = sourceBuild(url, userId);

  return {
    item,
    userId,
    url,
    role,
    domain,
  };
};
