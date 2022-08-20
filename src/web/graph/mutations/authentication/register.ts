import { EMAIL_ERROR } from "../../../../core/strings";
import { UsersController } from "../../../../core/controllers";
import { cookieConfigs } from "../../../../config";

// register a user account via mutation
export async function register(
  _,
  { email, password, googleId, githubId },
  context
) {
  const loginUser = await UsersController().createUser({
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
