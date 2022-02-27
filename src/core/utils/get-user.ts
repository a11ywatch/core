import { decodeJwt, verifyJwt } from "./auth";

export const getUser = (bearerToken: string): any => {
  const token = bearerToken?.includes("Bearer ")
    ? bearerToken.split(" ")[1]
    : bearerToken;

  if (token) {
    // todo: check verify passing of decode
    if (verifyJwt(token)) {
      return decodeJwt(token);
    }
  }

  return false;
};
