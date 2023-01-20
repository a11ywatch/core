import {
  user,
  website,
  websites,
  pages,
  history,
  issue,
  issues,
  pageInsights,
} from "./graph/queries";

export const Query = {
  issue,
  issues,
  history,
  pages,
  website,
  websites,
  user,
  pagespeed: pageInsights,
};
