import { addMonths, differenceInMonths } from "date-fns";
import { getUser } from "../find";
import { SUPER_MODE } from "../../../../config/config";
import { User } from "../../../../types/schema";

const validateResetDate = (date: number | Date) =>
  differenceInMonths(date, new Date());

// Run init user stats verify
// @returns Promise<void>
export const runUserChecks = async ({
  userId,
  user,
  collection,
}: {
  userId?: number;
  collection?: any;
  user?: User;
}): Promise<void> => {
  // if SUPER_MODE always return truthy
  if (SUPER_MODE) {
    return;
  }

  // get collection if does not exist
  if (!collection) {
    [user, collection] = await getUser({ id: userId });
  }

  // return false if email not confirmed
  if (user && !user.emailConfirmed) {
    return;
  }

  if (user) {
    const currentDate = new Date();
    const scanInfo = user?.scanInfo ?? {
      lastScanDate: null,
      totalUptime: 0,
      creditedUptime: 0,
      usageLimit: 0,
    };

    // reset free users on next anchor
    if (!user.role && validateResetDate(user.usageAnchorDate)) {
      user.usageAnchorDate = addMonths(user.usageAnchorDate, 1);
      scanInfo.totalUptime = 0;
    }

    try {
      await collection.findOneAndUpdate(
        { id: user.id },
        {
          $set: {
            usageAnchorDate: user.usageAnchorDate,
            scanInfo,
            lastLoginDate: currentDate,
          },
        }
      );
    } catch (e) {
      console.error(e);
    }
  }
};
