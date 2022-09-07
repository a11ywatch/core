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

// todo: handle email cancellation instead of token to send email to confirm
export const cancelSubscription = async (_, { _email }, context) => {
  const { userId: keyid } = getPayLoad(context);

  let response;

  // todo: if _email found send confirmation if token not found

  try {
    response = await UsersController().cancelSubscription({
      keyid,
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
