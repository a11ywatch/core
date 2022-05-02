import type { User } from "@app/schema";
import { Request, Response } from "express";
import { UsersController } from "../controllers";
import { RATE_EXCEEDED_ERROR } from "../strings";
import { usageExceededThreshold } from "./get-usage";
import { getUserFromToken } from "./get-user";
import { config } from "@app/config/config";

// get user from token and db if allowed to perform request otherwise exit
export const getUserFromApi = async (
  token: string,
  res: Response,
  req: Request
): Promise<User> => {
  // single get user from auth
  let data = {};

  const user = getUserFromToken(token);
  const { keyid, audience } = user?.payload ?? {};

  // check if origin is from front-end client simply allow rate limits
  const isClient =
    req.get("origin") === config.CLIENT_URL ||
    req.get("origin") === config.DOMAIN;

  /// front-end domain allow all besides rate limits
  if (isClient) {
    if (typeof keyid !== "undefined") {
      const [userData] = await UsersController({
        user,
      }).getUser({ id: keyid });
      if (userData) {
        data = userData;
      }
    }
  } else {
    if (typeof keyid === "undefined") {
      res.status(401);
      res.json({
        data: null,
        message:
          "Authentication required. Add your authentication header and try again.",
        success: false,
      });
      return;
    }
    const [userData] = await UsersController({
      user,
    }).updateApiUsage({ id: keyid }, true);

    if (
      usageExceededThreshold({
        audience,
        usage: userData?.apiUsage?.usage || 0,
      })
    ) {
      res.status(400);
      res.json({
        data: null,
        message: RATE_EXCEEDED_ERROR,
        success: false,
      });
      return;
    }

    if (userData) {
      data = userData;
    }
  }

  return data;
};
