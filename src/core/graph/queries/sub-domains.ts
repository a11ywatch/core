import { getPayLoad } from "../../utils/query-payload";

// rename to pages
export const subDomains = async (_, { domain, ...props }, context) => {
  const userId = getPayLoad(context, props)?.userId;

  return await context.models.SubDomain.getDomains({
    userId,
    domain,
  });
};
