import { getUser } from "../find";
import { isSameDay } from "date-fns";
import { SUPER_MODE } from "@app/config/config";

// Determine if user can perform web accessibility scanning
export const updateScanAttempt = async ({ userId, user, collection }) => {
  // if SUPER_MODE always return truthy
  if (SUPER_MODE) {
    return true;
  }

  // get collection if does not exist
  if (!collection && typeof userId !== "undefined") {
    try {
      [user, collection] = await getUser({ id: userId });
    } catch (e) {
      console.error(e);
    }
  }

  if (user) {
    const scanInfo = user?.scanInfo ?? {
      lastScanDate: undefined as Date,
      totalUptime: 0,
      usageLimit: 0,
    };

    const currentDate = new Date();

    if (!isSameDay(scanInfo?.lastScanDate, currentDate)) {
      scanInfo.totalUptime = 0;
    }

    const canScan = validateScanEnabled({ user });

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
 * determine if user can do any scans
 */
export const validateScanEnabled = ({ user }) => {
  if (!SUPER_MODE) {
    const totalUptime = user?.scanInfo?.totalUptime ?? 0;
    const role = user?.role; // users role

    if (
      !user ||
      (role === 0 && totalUptime >= 30000) || // 30 seconds
      (role === 1 && totalUptime >= 300000) || // base uptime 5 mins x10
      (role === 2 && totalUptime >= 800000) || // premium 13 mins
      (role == 3 && totalUptime >= (user?.scanInfo?.usageLimit || 13) * 60000)
    ) {
      return false;
    }
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
