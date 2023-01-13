import {
  user,
  website,
  websites,
  pages,
  history,
  scripts,
  issue,
  issues,
  pageInsights,
} from "./graph/queries";

export const Query = {
  issue,
  issues,
  history,
  scripts,
  pages,
  website,
  websites,
  user,
  pagespeed: pageInsights,
};
