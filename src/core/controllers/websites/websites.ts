import {
  getWebsitesCrawler,
  getWebsite,
  getWebsites,
  getWebsitesWithUsers,
} from "./find";
import { updateWebsite } from "./update";
import { addWebsite } from "./set";
import { removeWebsite } from "./remove";

export const WebsitesController = ({ user } = { user: null }) => ({
  getWebsite,
  getWebsites,
  getWebsitesCrawler,
  getWebsitesWithUsers,
  addWebsite,
  removeWebsite,
  updateWebsite,
});
