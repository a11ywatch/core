import { SUPER_MODE } from "../../../config/config";

// return truthy if website should be blocked from adding
export const blockWebsiteAdd = ({
  audience,
  collectionCount,
}: any): boolean => {
  // if super mode allow all websites
  if (SUPER_MODE) {
    return false;
  }

  // 1 website allowed
  if (!audience && collectionCount >= 1) {
    return true;
  }

  // 50 website allowed
  if (audience && collectionCount >= 50) {
    return true;
  }

  return false;
};
