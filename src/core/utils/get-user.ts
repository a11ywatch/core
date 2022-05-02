import { decodeJwt, verifyJwt } from "./auth";

// veryify jwt and decode
export const getUserFromToken = (bearerToken: string): any => {
  const token = bearerToken?.includes("Bearer ")
    ? bearerToken.split(" ")[1]
    : bearerToken;

  if (token) {
    try {
      if (verifyJwt(token)) {
        return decodeJwt(token);
      }
    } catch (e) {
      console.error(e);
    }
  }
};
