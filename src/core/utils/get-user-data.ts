import type { User } from "@app/schema";
import { Request, Response } from "express";
import { UsersController } from "../controllers";
import { RATE_EXCEEDED_ERROR } from "../strings";
import { getUserFromToken, extractTokenKey } from "./get-user";
import { config } from "@app/config/config";
import { frontendClientOrigin } from "./is-client";

// return a user from id
const getUserFromId = async (user, keyid) => {
  let userData;
  let collectionData;

  if (typeof keyid !== "undefined") {
    const [data, collection] = await UsersController({
      user,
    }).getUser({ id: keyid });

    userData = data;
    collectionData = collection;
  }

  return [userData, collectionData];
};

/*
 * Get the user if auth set or determine if request allowed.
 * This method handles sending headers and will return void next action should not occur.
 * @return User
 **/
export const getUserFromApi = async (
  token: string,
  req: Request,
  res: Response
): Promise<User> => {
  const jwt = extractTokenKey(token ? String(token).trim() : "");
  const user = getUserFromToken(jwt);

  // the user id from the token
  const { keyid } = user?.payload ?? {};

  // api key is set [ may not be valid ]
  const authenticated = typeof keyid !== "undefined";

  // response return data
  let data = {};

  // simply get the user and return [no updates on counters]
  if (config.SUPER_MODE) {
    const [userData] = await getUserFromId(user, keyid);

    return userData ?? data;
  }

  // check if origin is from front-end client simply allow rate limits or super mode
  const isClient = frontendClientOrigin(req.get("origin"));

  // auth required unless front-end client
  if (!isClient && !authenticated) {
    res.status(401);
    res.json({
      data: null, // TODO: return `data` key instead of website for json response
      message:
        "Authentication required. Add your authentication header and try again.",
      success: false,
    });
    return;
  }

  /// front-end domain allow all besides rate limits
  if (isClient) {
    if (authenticated) {
      const [userData] = await getUserFromId(user, keyid);

      data = userData;
    }
  } else {
    const [userData, _, canScan] = await UsersController({
      user,
    }).updateApiUsage({ id: keyid });

    // auth required unless front-end client. TODO: validate old keys with current user in DB. jwt === user.jwt.
    if (jwt && !userData) {
      res.json({
        data: null,
        message: "Error, API token is invalid. Please update your API token.",
        success: false,
      });
      return;
    }

    // check usage limits
    if (!canScan) {
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

/*
 * Get user from token and db if allowed to perform request otherwise exit
 * Updates multi-site scan attempt counter.
 * A user id is required to target the website.
 */
export const getUserFromApiScan = async (
  token: string,
  _req: Request,
  res: Response
): Promise<User> => {
  // single get user from auth
  const jwt = extractTokenKey(token ? String(token).trim() : "");

  const user = getUserFromToken(jwt);
  const { keyid } = user?.payload ?? {};

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

  const [userData, collection] = await getUserFromId(user, keyid);

  const data = userData ?? {};

  const canScan = await UsersController({
    user,
  }).updateScanAttempt({ id: keyid, user: data, collection }, true);

  if (!config.SUPER_MODE && !canScan) {
    res.json({
      data: null,
      message: RATE_EXCEEDED_ERROR,
      success: false,
    });
    return;
  }

  return data;
};
