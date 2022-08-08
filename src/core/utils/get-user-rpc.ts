import type { User } from "@app/types/schema";
import { UsersController } from "../controllers";
import { getUserFromToken, extractTokenKey } from "./get-user";
import { config } from "@app/config/config";
import { getUserFromId } from "./get-user-data";

/*
 * Get the user if auth set or determine if request allowed gRPC.
 * This method handles sending headers and will return void next action should not occur. [TODO: refactor]
 * @return User
 **/
export const getUserFromApi = async (token: string): Promise<User> => {
  const jwt = extractTokenKey(token ? String(token).trim() : "");
  const user = getUserFromToken(jwt);
  // the user id from the token
  const { keyid } = user?.payload ?? {};

  // response return data
  let data = {};

  // simply get the user and return [no updates on counters]
  if (config.SUPER_MODE) {
    const [userData] = await getUserFromId(user, keyid);

    return userData ?? data;
  }

  // auth required unless front-end client
  if (!token) {
    return {};
  }

  const [userData, _, canScan] = await UsersController({
    user,
  }).updateApiUsage({ id: keyid });

  // auth required unless front-end client. TODO: validate old keys with current user in DB. jwt === user.jwt.
  if (jwt && !userData) {
    return {};
  }

  // check usage limits
  if (!canScan) {
    return {};
  }

  if (userData) {
    data = userData;
  }

  return data;
};
