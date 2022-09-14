import { UsersController } from "../../../core/controllers";
import { getPayLoad } from "../../../core/utils/query-payload";

export const updateUser = async (
  _,
  { email, password, newPassword, stripeToken },
  context
) => {
  // get authenticated user for request
  const { userId } = getPayLoad(context);

  return await UsersController().updateUser({
    email,
    password,
    newPassword,
    stripeToken,
    userId,
  });
};
