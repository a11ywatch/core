import { isSameDay } from "date-fns";
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
  let scanBlocked = false;

  if (!SUPER_MODE) {
    const totalUptime = user?.scanInfo?.totalUptime ?? 0;
    const role = user?.role; // users role

    switch (role) {
      case 0: {
        scanBlocked = totalUptime >= 30000;
        break;
      }
      // normal plans
      case 1: {
        scanBlocked = totalUptime >= 500000;
        break;
      }
      case 2: {
        scanBlocked = totalUptime >= 1000000;
        break;
      }
      case 3: {
        scanBlocked = totalUptime >= 2000000;
        break;
      }
      case 4: {
        scanBlocked = totalUptime >= 5000000;
        break;
      }
      case 5: {
        scanBlocked = totalUptime >= 15000000;
        break;
      }
      // high tier plans
      case 6: {
        scanBlocked = totalUptime >= 50000000;
        break;
      }
      case 7: {
        scanBlocked = totalUptime >= 100000000;
        break;
      }
      case 8: {
        scanBlocked = totalUptime >= 200000000;
        break;
      }
      case 9: {
        scanBlocked = totalUptime >= 300000000;
        break;
      }
      case 10: {
        scanBlocked = totalUptime >= 500000000;
        break;
      }
      default: {
        scanBlocked = false;
        break;
      }
    }
    // todo: custom usagelimit
    // user?.scanInfo?.usageLimit
  }

  return scanBlocked;
};

/*
 * @param {userId: number}
 * determine if user has muti site scans enabled
 */
export const getScanEnabled = async ({ userId }) => {
  const [user] = await getUser({ id: userId });

  return validateScanEnabled({ user });
};
