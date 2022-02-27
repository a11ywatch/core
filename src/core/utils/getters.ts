export const realUser = (userId?: number): boolean | number =>
  typeof userId !== "undefined" &&
  (Number(userId) < 0 || userId || userId === 0);
