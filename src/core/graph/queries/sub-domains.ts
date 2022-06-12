import { getPayLoad } from "../../utils/query-payload";

// rename to pages
export const pages = async (_, { domain, ...props }, context) => {
  const userId = getPayLoad(context, props)?.userId;

  return await context.models.Pages.getDomains({
    userId,
    domain: decodeURIComponent(domain),
  });
};
