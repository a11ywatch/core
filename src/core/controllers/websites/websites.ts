import {
  getWebsite,
  getWebsites,
  getWebsitesWithUsers,
  getWebsitesPaginated,
} from "./find";
import { updateWebsite, sortWebsites } from "./update";
import { addWebsite } from "./set";
import { removeWebsite } from "./remove";
import { websitesCollection } from "../../../database";

export const WebsitesController = ({ user } = { user: null }) => ({
  getCollection: websitesCollection,
  getWebsite,
  getWebsites,
  getWebsitesPaginated,
  getWebsitesWithUsers,
  addWebsite,
  removeWebsite,
  updateWebsite,
  sortWebsites,
});
