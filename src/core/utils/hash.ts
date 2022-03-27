import { createHash } from "crypto";

export const hashString = (target: string | number) => {
  const hash = createHash("sha256");
  hash.update(target + "");

  return hash.digest("hex");
};
