import { UsersController } from "../../controllers";
import { getPayLoad } from "../../utils/query-payload";

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
