import type { FastifyContext } from "apollo-server-fastify";
import type { User } from "../../types/schema";
import { UsersController } from "../controllers";
import { RATE_EXCEEDED_ERROR } from "../strings";
import { getUserFromToken, extractTokenKey } from "./get-user";
import { config } from "../../config/config";
import { frontendClientOrigin } from "./is-client";
import { StatusCode } from "../../web/messages/message";
import { validateUID } from "../../web/params/extracter";

// return a user from id
export const getUserFromId = async (user, keyid) => {
  // a valid keyid required
  if (!validateUID(keyid)) {
    return [null, null];
  }

  // [data, collection]
  return await UsersController({
    user,
  }).getUser({ id: keyid });
};

/*
 * Get the user if auth set or determine if request allowed.
 * This method handles sending headers and will return void next action should not occur. [TODO: refactor]
 * @return User
 **/
export const getUserFromApi = async (
  token: string,
  req: FastifyContext["request"],
  res: FastifyContext["reply"]
): Promise<User> => {
  const jwt = extractTokenKey(token ? String(token).trim() : "");
  const user = getUserFromToken(jwt);
  const { keyid } = user?.payload ?? {};
  const authenticated = typeof keyid !== "undefined";

  // response return data
  let data = {};

  // simply get the user and return [no updates on counters]
  if (config.SUPER_MODE) {
    const [userData] = await getUserFromId(user, keyid);

    return userData ?? data;
  }

  // check if origin is from front-end client simply allow rate limits or super mode
  const isClient = frontendClientOrigin(req.headers["origin"]);

  // auth required unless front-end client
  if (!isClient && !token) {
    res.send({
      data: null,
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

    if (jwt && !userData) {
      res.send({
        data: null,
        message: "Error, API token is invalid. Please update your API token.",
        success: false,
      });
      return;
    }

    // check usage limits
    if (!canScan) {
      res.send({
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
 * This method returns void and response status if un-authed
 * @returns Promise<User> | void
 */
export const getUserFromApiScan = async (
  token: string = "",
  _req: FastifyContext["request"],
  res: FastifyContext["reply"]
): Promise<User> => {
  // auth required unless SUPER MODE

  if (!token && !config.SUPER_MODE) {
    res.status(StatusCode.Unauthorized);
    res.send({
      data: null,
      message:
        "Authentication required. Add your Authorization header and try again.",
      success: false,
    });
    return;
  }

  const [user, collection] = await retreiveUserByToken(token);

  // if SUPER mode allow request reguardless of scans
  if (config.SUPER_MODE) {
    return user || {};
  }

  const canScan = await UsersController({
    user,
  }).updateScanAttempt({ id: user.id, user: user, collection });

  if (!config.SUPER_MODE && !canScan) {
    res.send({
      data: null,
      message: RATE_EXCEEDED_ERROR,
      success: false,
    });
    return;
  }

  return user;
};

/*
 * Get the user by jwt.
 * @return User
 **/
export const retreiveUserByToken = async (
  token: string
): Promise<[User, any]> => {
  const jwt = extractTokenKey(token ? String(token).trim() : "");
  const user = getUserFromToken(jwt);
  // the user id from the token
  const { keyid } = user?.payload ?? {};

  const [u, c] = await getUserFromId(user, keyid);

  return [u, c];
};

// wrapper to get data
export const retreiveUserByTokenWrapper = async (token) => {
  const [user] = await retreiveUserByToken(token);

  return user;
};
