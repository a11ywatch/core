import { UsersController } from "../../../core/controllers";
import { cookieConfigs } from "../../../config";
import { getPayLoad } from "../../../core/utils/query-payload";

// add a payment subscription for a plan
export const addPaymentSubscription = async (
  _,
  { stripeToken, yearly },
  context
) => {
  const { userId: keyid } = getPayLoad(context);

  let response;

  try {
    response = await UsersController().addPaymentSubscription({
      keyid,
      stripeToken,
      yearly,
    });

    if (response?.user) {
      context.res.cookie("jwt", response.user.jwt, cookieConfigs);
    }
  } catch (e) {
    console.error(e);
  }

  return response;
};
export const cancelSubscription = async (_, { email }, context) => {
  const { userId: keyid } = getPayLoad(context);

  let response;

  try {
    response = await UsersController().cancelSubscription({
      keyid,
      email,
    });

    if (response?.user) {
      context.res.clearCookie("jwt");
      context.res.cookie("jwt", response.user.jwt, cookieConfigs);
    }
  } catch (e) {
    console.error(e);
  }

  return response;
};
