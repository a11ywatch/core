import { UsersController } from "../../controllers";
import { EMAIL_ERROR } from "../../strings";
import { getPayLoad } from "../../utils/query-payload";

// NOTE: Rename to updateUserPassword
export const updateUser = async (
  _,
  { email, password, newPassword, stripeToken },
  context
) => {
  const { subject } = getPayLoad(context);
  const loginUser = await UsersController().updateUser({
    email: subject || email,
    password,
    newPassword,
    stripeToken,
  });

  if (!loginUser) {
    throw new Error(EMAIL_ERROR);
  }

  return loginUser;
};
