import { getPages, getPage, getAllPages, getPagesPaging } from "./find";
import { generateWebsiteScore } from "./update";
import { connect } from "../../../database/client";

// Page outside the main website
const PagesController = ({ user } = { user: null }) => {
  return {
    getCollection: () => {
      const [collection] = connect("Pages");

      return collection;
    },
    getPage,
    getPages,
    getAllPages,
    generateWebsiteScore,
    getPagesPaging,
  };
};

export { PagesController };
