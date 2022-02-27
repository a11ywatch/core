import { isBefore } from "date-fns";
import { pubsub } from "@app/core/graph/subscriptions";
import { EMAIL_VERIFIED } from "../../../static";
import { getUser } from "../find";

export const validateEmail = async ({ code }) => {
  if (code) {
    const [user, collection] = await getUser({ emailConfirmCode: code }, true);

    if (user && isBefore(new Date(), new Date(user?.emailExpDate))) {
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

      await pubsub.publish(EMAIL_VERIFIED, { emailVerified: true });

      return true;
    }
    return false;
  } else {
    return false;
  }
};
