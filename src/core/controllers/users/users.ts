import { isBefore } from "date-fns";
import { footer } from "../../../html";
import { GENERAL_ERROR, PASSWORD_ERROR, SUCCESS } from "../../strings";
import {
  transporter,
  mailOptions,
  saltHashPassword,
  signJwt,
  sendMailCallback,
} from "../../utils";
import { getWebsite } from "../websites";
import { getUser } from "./find";
import {
  updateApiUsage,
  updateScanAttempt,
  toggleAlert,
  toggleProfile,
  verifyUser,
  forgotPassword,
  confirmEmail,
  unsubscribeEmails,
  resetPassword,
  validateEmail,
  addPaymentSubscription,
  cancelSubscription,
} from "./update";
import { createUser } from "./set";
import type { UserControllerType } from "./types";

export const UsersController: UserControllerType = (
  { user: _user } = { user: null }
) => ({
  getUser,
  updateApiUsage,
  verifyUser,
  createUser,
  addPaymentSubscription,
  cancelSubscription,
  updateFilterEmailDates: async ({
    id,
    emailFilteredDates,
    morning = false,
  }) => {
    const [user, collection] = await getUser({ id });

    if (user) {
      await collection.updateOne(
        { id },
        {
          $set: {
            emailFilteredDates,
            emailMorningOnly: morning,
          },
        }
      );

      return {
        user,
        code: 200,
        success: true,
        message: SUCCESS,
      };
    }

    throw new Error(GENERAL_ERROR);
  },
  // TODO: Should be renamed update user password
  updateUser: async ({ password, email, newPassword, stripeToken }) => {
    const [user, collection] = await getUser({ email });

    const salthash = saltHashPassword(password, user?.salt);
    const authless = !user?.password && !user?.googleId;

    // TODO: SEPERATE PASSWORD RESETTING
    if (
      password &&
      user?.password &&
      user?.password !== salthash?.passwordHash
    ) {
      throw new Error(PASSWORD_ERROR);
    }
    if (!user) {
      throw new Error("Error user not found.");
    }

    if (
      newPassword &&
      (user?.password === salthash?.passwordHash || authless)
    ) {
      const jwt = await signJwt({
        email,
        role: user?.role,
        keyid: user?.id,
      });
      const newSaltHash = saltHashPassword(newPassword);

      await collection.updateOne(
        { email },
        {
          $set: {
            jwt,
            password: newSaltHash?.passwordHash,
            salt: newSaltHash?.salt,
            stripeToken,
          },
        }
      );

      return {
        user,
        jwt,
        code: 200,
        success: true,
        message: SUCCESS,
      };
    }

    throw new Error(GENERAL_ERROR);
  },
  forgotPassword,
  resetPassword,
  toggleAlert,
  toggleProfile,
  confirmEmail,
  updateScanAttempt,
  validateEmail,
  unsubscribeEmails,
  sendWebsiteOffline: async ({ id, domain }) => {
    try {
      const [user, collection] = await getUser({ id });

      if (user?.alertEnabled === false || !domain) {
        return false;
      }

      const [website, websiteCollection] = await getWebsite({
        userId: id,
        domain,
      });

      if (website) {
        await websiteCollection.findOneAndUpdate(
          { userId: id, domain: domain },
          {
            $set: {
              online: false,
            },
          }
        );
      }

      let shouldEmail = false;

      if (user?.downAlerts?.length) {
        const newAlerts = user?.downAlerts?.map((item: any) => {
          if (
            item.domain === domain &&
            isBefore(new Date(), new Date(item?.date))
          ) {
            shouldEmail = true;
            item.date = new Date().toUTCString();
          }
          return item;
        });
        if (shouldEmail) {
          await collection.findOneAndUpdate(
            { id: id },
            {
              $set: {
                downAlerts: newAlerts,
              },
            }
          );
        }
      } else {
        const downAlerts = [{ domain, date: new Date().toUTCString() }];
        shouldEmail = true;
        await collection.findOneAndUpdate(
          { id: id },
          {
            $set: {
              downAlerts,
            },
          }
        );
      }
      if (shouldEmail) {
        await transporter.sendMail(
          {
            ...mailOptions,
            to: user.email,
            subject: `${domain} is Offline.`,
            html: `<h1>${domain} is currently offline.</h1><br /><p>Please check your server logs to see what happened if issues are difficult to figure out.</p><br />${footer.marketing(
              { userId: id, email: user?.email }
            )}`,
          },
          sendMailCallback
        );
      }
    } catch (e) {
      console.error(e);
      return false;
    }
  },
  setPageSpeedKey: async ({ id, pageSpeedApiKey }) => {
    const [user, collection] = await getUser({ id });

    if (user) {
      await collection.updateOne(
        { id },
        {
          $set: {
            pageSpeedApiKey,
          },
        }
      );

      user.pageSpeedApiKey = pageSpeedApiKey;

      return {
        user,
        code: 200,
        success: true,
        message: SUCCESS,
      };
    }

    throw new Error(GENERAL_ERROR);
  },
});
