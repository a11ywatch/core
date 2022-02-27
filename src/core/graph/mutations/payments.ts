import { cookieConfigs } from "../../../config";
import { getPayLoad } from "../../utils/query-payload";

export const addPaymentSubscription = async (
  _,
  { stripeToken, yearly },
  context
) => {
  const { userId: keyid, audience } = getPayLoad(context);

  let response;

  try {
    response = await context.models.User.addPaymentSubscription({
      keyid,
      audience,
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
  const { userId: keyid, audience } = getPayLoad(context);

  let response;

  try {
    response = await context.models.User.cancelSubscription({
      keyid,
      audience,
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
