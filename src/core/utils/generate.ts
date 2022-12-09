import { randomBytes } from "crypto";

// generate random number with fallback 7 chars by default
export const asyncRandomGenerate = (size = 4): Promise<string> => {
  return new Promise((resolve) => {
    randomBytes(size, (err, buf) => {
      if (err) {
        resolve(Math.random().toString(36).substring(2, 9));
      } else {
        resolve(buf.toString("hex"));
      }
    });
  });
};
