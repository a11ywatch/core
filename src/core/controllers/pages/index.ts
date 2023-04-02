import { getPages, getPage, getAllPages, getPagesPaging } from "./find";
import { generateWebsiteScore } from "./update";
import { pagesCollection } from "../../../database/client";

// Page outside the main website
const PagesController = ({ user } = { user: null }) => {
  return {
    getCollection: pagesCollection,
    getPage,
    getPages,
    getAllPages,
    generateWebsiteScore,
    getPagesPaging,
  };
};

export { PagesController };
