import { isSameDay } from "date-fns";
import { getUsageLimitsMs } from "@a11ywatch/website-source-builder";
import { getUser } from "../find";
import { SUPER_MODE } from "../../../../config/config";

// Determine if user can perform web accessibility scanning
// @returns Promise<boolean>
export const updateScanAttempt = async ({ userId, user, collection }) => {
  // if SUPER_MODE always return truthy
  if (SUPER_MODE) {
    return true;
  }

  // get collection if does not exist
  if (!collection && typeof userId !== "undefined") {
    [user, collection] = await getUser({ id: userId });
  }

  if (user) {
    const currentDate = new Date();

    const scanInfo = user?.scanInfo ?? {
      lastScanDate: null,
      totalUptime: 0,
      usageLimit: 0,
    };

    if (
      !scanInfo?.lastScanDate ||
      !isSameDay(scanInfo?.lastScanDate, currentDate)
    ) {
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

    return canScan;
  }

  return false;
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
