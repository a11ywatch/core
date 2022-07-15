import { Jwt } from "jsonwebtoken";
import { decodeJwt, verifyJwt } from "./auth";

export const extractTokenKey = (bearerToken: string) =>
  bearerToken?.includes("Bearer ") ? bearerToken.split(" ")[1] : bearerToken;

// veryify jwt and decode
export const getUserFromToken = (
  bearerToken?: string
): null | (Jwt & { payload: Partial<Jwt["payload"] & { keyid: number }> }) => {
  const token = extractTokenKey(bearerToken);

  if (token) {
    try {
      if (verifyJwt(token)) {
        return decodeJwt(token);
      }
    } catch (e) {
      console.error(e);
    }
  }

  return null;
};
