export const blockWebsiteAdd = ({
  audience,
  collectionCount,
}: any): boolean => {
  if (audience === "admin") {
    return false;
  }
  return (
    (!audience && collectionCount === 1) ||
    (audience === 1 && collectionCount === 4) ||
    (audience === 2 && collectionCount === 10)
  );
};
