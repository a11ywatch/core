import { SUPER_MODE } from "@app/config/config";

// return truthy if website should be blocked from adding
export const blockWebsiteAdd = ({
  audience,
  collectionCount,
  limit,
}: any): boolean => {
  // if super mode allow all websites
  if (SUPER_MODE) {
    return false;
  }

  // 1 website allowed
  if (!audience && collectionCount >= 1) {
    return true;
  }

  // 3 website allowed
  if (audience === 1 && collectionCount >= 3) {
    return true;
  }

  // 8 website allowed
  if (audience === 2 && collectionCount >= 8) {
    return true;
  }

  const maxLimit = limit > 8 ? limit : 8;

  if (audience === 3 && collectionCount >= maxLimit) {
    return true;
  }

  return false;
};
