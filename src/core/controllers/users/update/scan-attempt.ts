import { addMonths, differenceInMonths } from "date-fns";
import { getUsageLimitsMs } from "@a11ywatch/website-source-builder";
import { getUser } from "../find";
import { SUPER_MODE } from "../../../../config/config";
import { User } from "../../../../types/schema";
import { validateUID } from "../../../../web/params/extracter";

const validateResetDate = (date: number | Date) =>
  differenceInMonths(date, new Date());

// Determine if user can perform web accessibility scanning
// @returns Promise<[boolean, User]>
export const updateScanAttempt = async ({
  userId,
  user,
  collection,
  ping,
}: {
  userId?: number;
  collection?: any;
  user?: User;
  ping?: boolean;
}): Promise<[boolean, User?, any?]> => {
  // if SUPER_MODE always return truthy
  if (SUPER_MODE) {
    return [true, null, collection];
  }

  // get collection if does not exist
  if (!collection && validateUID(userId)) {
    [user, collection] = await getUser({ id: userId });
  }

  // return false if email not confirmed
  if (user && !user.emailConfirmed) {
    return [false, user, collection];
  }

  if (user) {
    const currentDate = new Date();
    const scanInfo = user?.scanInfo ?? {
      lastScanDate: null,
      totalUptime: 0,
      creditedUptime: 0,
      usageLimit: 0,
    };

    // ping simply update dates and usage
    if (ping) {
      if (!user.role && validateResetDate(user.usageAnchorDate)) {
        user.usageAnchorDate = addMonths(user.usageAnchorDate, 1);
        scanInfo.totalUptime = 0;
      }

      const updateProps = {
        usageAnchorDate: user.usageAnchorDate,
        scanInfo,
        lastLoginDate: new Date(),
      };

      try {
        await collection.findOneAndUpdate(
          { id: user.id },
          { $set: updateProps }
        );
      } catch (e) {
        console.error(e);
      }
    } else {
      if (!user.role && validateResetDate(user.usageAnchorDate)) {
        user.usageAnchorDate = addMonths(user.usageAnchorDate, 1);
        scanInfo.totalUptime = 0;
      }

      const canScan = validateScanEnabled({
        user: {
          role: user?.role,
          scanInfo,
        },
      });

      // update the scan attempt if next day
      if (canScan) {
        scanInfo.lastScanDate = currentDate;
        try {
          await collection.findOneAndUpdate(
            { id: user.id },
            { $set: { scanInfo } }
          );
        } catch (e) {
          console.error(e);
        }
      }

      return [canScan, user, collection];
    }
  }

  return [false, user, collection];
};

/*
 * @param {user: User}
 * determine if user can do any scans returns true if can scan [todo: x 30 for month usage]
 */
export const validateScanEnabled = ({ user }) => {
  if (!SUPER_MODE) {
    const totalUptime = user?.scanInfo?.totalUptime ?? 0;
    const role = user?.role ?? 0; // users role

    return totalUptime <= getUsageLimitsMs(role);
  }

  return true;
};

/*
 * @param {userId: number}
 * determine if user has muti site scans enabled
 */
export const getScanEnabled = async ({ userId }) => {
  const [user] = await getUser({ id: userId });

  return validateScanEnabled({ user });
};
