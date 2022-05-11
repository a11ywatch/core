import type { User } from "@app/schema";
import { Request, Response } from "express";
import { UsersController } from "../controllers";
import { RATE_EXCEEDED_ERROR } from "../strings";
import { usageExceededThreshold } from "./get-usage";
import { getUserFromToken } from "./get-user";
import { config } from "@app/config/config";

// return a user from id
const getUserFromId = async (user, keyid) => {
  if (typeof keyid !== "undefined") {
    const [userData] = await UsersController({
      user,
    }).getUser({ id: keyid });
    return userData;
  }
};

/*
 * Get the user if auth set or determine if request allowed.
 * This method handles sending headers and will return void next action should not occur.
 **/
export const getUserFromApi = async (
  token: string,
  req: Request,
  res: Response
): Promise<User> => {
  // single get user from auth
  let data = {};

  const user = getUserFromToken(token ? String(token).trim() : "");

  const { keyid, audience } = user?.payload ?? {};

  // simply get the user and return
  if (config.SUPER_MODE) {
    return (await getUserFromId(user, keyid)) ?? data;
  }

  // check if origin is from front-end client simply allow rate limits or super mode
  const isClient =
    req.get("origin") === config.CLIENT_URL ||
    req.get("origin") === config.DOMAIN;

  // auth required unless front-end client
  if (!isClient && typeof keyid === "undefined") {
    res.status(401);
    res.json({
      website: null, // TODO: return `data` key instead of website for json response
      message:
        "Authentication required. Add your authentication header and try again.",
      success: false,
    });
    return;
  }

  /// front-end domain allow all besides rate limits
  if (isClient) {
    if (typeof keyid !== "undefined") {
      data = await getUserFromId(user, keyid);
    }
  } else {
    const [userData] = await UsersController({
      user,
    }).updateApiUsage({ id: keyid }, true);

    if (userData) {
      data = userData;
    }

    // check usage limits
    if (
      usageExceededThreshold({
        audience,
        usage: userData?.apiUsage?.usage || 0,
        usageLimit: userData?.apiUsage?.usageLimit,
      })
    ) {
      res.status(400);
      res.json({
        website: null,
        message: RATE_EXCEEDED_ERROR,
        success: false,
      });
      return;
    }
  }

  return data;
};

// get user from token and db if allowed to perform request otherwise exit
export const getUserFromApiScan = async (
  token: string,
  req: Request,
  res: Response
): Promise<User> => {
  // single get user from auth

  const user = getUserFromToken(token ? String(token).trim() : "");
  const { keyid } = user?.payload ?? {};

  if (typeof keyid === "undefined") {
    res.status(401);
    res.json({
      website: null,
      message:
        "Authentication required. Add your authentication header and try again.",
      success: false,
    });
    return;
  }

  const data = (await await getUserFromId(user, keyid)) ?? {};

  const canScan = await UsersController({
    user,
  }).updateScanAttempt({ id: keyid }, true);

  if (!config.SUPER_MODE && !canScan) {
    res.status(400);
    res.json({
      website: null,
      message: RATE_EXCEEDED_ERROR,
      success: false,
    });
    return;
  }

  return data;
};
