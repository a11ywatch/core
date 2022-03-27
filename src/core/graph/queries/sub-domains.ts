import { getPayLoad } from "../../utils/query-payload";

// rename to pages
export const subDomains = async (_, { domain, ...props }, context) => {
  return await context.models.SubDomain.getDomains({
    userId: getPayLoad(context, props),
    domain,
  });
};
