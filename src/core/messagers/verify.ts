import { isSameDay } from "date-fns";
import { getUser } from "../controllers/users";
import { getEmailAllowedForDay } from "../utils/filters";
import { realUser } from "../utils";

interface VerifySend {
  userId?: number;
  confirmedOnly: boolean;
  sendEmail: boolean;
}

// determine if user can get an email
export const verifyUserSend = async ({
  userId,
  confirmedOnly = false, // confirmed only requires user id - non marketing sending.
  sendEmail = false, // conditional to determine email sending. Without having to use conditionals.
}: VerifySend) => {
  let userResponse;
  let collectionResponse;

  // if the boolean is true the email send is allowed. TODO: remove from section.
  if (sendEmail && realUser(userId)) {
    const [user, collection] = await getUser({ id: userId });
    const userAlertsDisabled = !user || !user?.alertEnabled; // user alerts set to disabled.
    const confirmedOnlyUsers = confirmedOnly && !user?.emailConfirmed; // user email is not confirmed.
    const alertsDisabled = userAlertsDisabled || confirmedOnlyUsers; // if  user alerts disabled or email confirmed do not send.

    // if not the same day from last email
    if (!alertsDisabled && getEmailAllowedForDay(user)) {
      if (
        !user.lastAlertDateStamp ||
        !isSameDay(user?.lastAlertDateStamp, new Date())
      ) {
        userResponse = user;
        collectionResponse = collection;
      }
    }
  }

  return [userResponse, collectionResponse];
};
