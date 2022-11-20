import { EMAIL_ERROR } from "../../../strings";
import { UsersController } from "../../../controllers";
import { cookieConfigs } from "../../../../config";

// login user via mutation
export async function login(
  _,
  { email, password, googleId, githubId },
  context
) {
  const loginUser = await UsersController().verifyUser({
    email,
    password,
    googleId,
    githubId,
  });

  if (!loginUser) {
    throw new Error(EMAIL_ERROR);
  }

  if (context?.res?.cookie) {
    context.res.cookie("jwt", loginUser.jwt, cookieConfigs);
  }

  return loginUser;
}
