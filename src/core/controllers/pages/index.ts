import { getPages, getPage, getAllPages, getPagesPaging } from "./find";
import { generateWebsiteScore } from "./update";

// Page outside the main website
const PagesController = ({ user } = { user: null }) => {
  return {
    getPage,
    getPages,
    getAllPages,
    generateWebsiteScore,
    getPagesPaging,
  };
};

export { PagesController };
