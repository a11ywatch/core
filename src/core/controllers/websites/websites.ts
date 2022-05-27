import {
  getWebsite,
  getWebsites,
  getWebsitesWithUsers,
  getWebsitesPaginated,
} from "./find";
import { updateWebsite, sortWebsites } from "./update";
import { addWebsite } from "./set";
import { removeWebsite } from "./remove";

export const WebsitesController = ({ user } = { user: null }) => ({
  getWebsite,
  getWebsites,
  getWebsitesPaginated,
  getWebsitesWithUsers,
  addWebsite,
  removeWebsite,
  updateWebsite,
  sortWebsites,
});
