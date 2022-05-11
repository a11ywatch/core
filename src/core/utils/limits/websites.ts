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

  if (!audience && collectionCount >= 1) {
    return true;
  }
  if (audience === 1 && collectionCount >= 4) {
    return true;
  }
  if (audience === 2 && collectionCount >= 10) {
    return true;
  }

  const maxLimit = limit > 10 ? limit : 10;

  if (audience === 3 && collectionCount >= maxLimit) {
    return true;
  }

  return false;
};
