import { isBefore } from "date-fns";
import { pubsub } from "../../../../database/pubsub";
import { EMAIL_VERIFIED } from "../../../static";
import { getUser } from "../find";
import { stripe } from "../../../external/stripe";

export const validateEmail = async ({ code }) => {
  if (code) {
    const [user, collection] = await getUser({ emailConfirmCode: code });

    if (user && isBefore(new Date(), new Date(user?.emailExpDate))) {
      // if user containers subscription or stripe token update stripe email
      if (user.stripeID) {
        try {
          await stripe.customers.update(user.stripeID, { email: user.email });
        } catch (e) {
          console.error(e);
        }
      }

      await collection.findOneAndUpdate(
        { id: user.id },
        {
          $set: {
            emailConfirmed: true,
            emailExpDate: undefined,
            emailConfirmCode: undefined,
          },
        }
      );

      await pubsub
        .publish(EMAIL_VERIFIED, { emailVerified: true })
        .catch((e) => {
          console.error(e);
        });

      return true;
    }
    return false;
  } else {
    return false;
  }
};
