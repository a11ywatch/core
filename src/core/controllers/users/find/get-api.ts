import type { User } from "../../../../types/schema";
import { UsersController } from "../..";
import { getUserFromToken, extractTokenKey } from "../../../utils/get-user";
import { config } from "../../../../config/config";
import { getUserFromId } from "../../../utils/get-user-data";

/*
 * Get the user if auth set or determine if request allowed gRPC.
 * This method handles sending headers and will return void next action should not occur. [TODO: refactor]
 * @param token - string
 * @return Promise<User>
 **/
export const incrementApiByUser = async (token: string): Promise<User> => {
  // auth required unless front-end client
  if (!token) {
    return {};
  }

  const jwt = extractTokenKey(String(token).trim());
  const user = getUserFromToken(jwt);
  // the user id from the token
  const { keyid } = user?.payload ?? {};

  // prevent API updates super mode
  if (config.SUPER_MODE) {
    const [userData] = await getUserFromId(user, keyid);
    return userData ?? {};
  }

  const [userData] = await UsersController({
    user,
  }).updateApiUsage({ id: keyid });

  return userData ?? {};
};
