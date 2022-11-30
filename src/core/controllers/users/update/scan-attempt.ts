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
    let scanBlocked = false;

    const totalUptime = user?.scanInfo?.totalUptime ?? 0;
    const role = user?.role ?? 0; // users role

    switch (role) {
      case 0: {
        // 10 seconds daily
        scanBlocked = totalUptime >= 10000;
        break;
      }
      // normal plans
      case 1: {
        scanBlocked = totalUptime >= 300000;
        break;
      }
      case 2: {
        scanBlocked = totalUptime >= 600000;
        break;
      }
      case 3: {
        scanBlocked = totalUptime >= 1400000;
        break;
      }
      case 4: {
        scanBlocked = totalUptime >= 2000000;
        break;
      }
      case 5: {
        scanBlocked = totalUptime >= 4000000;
        break;
      }
      // high tier plans
      case 6: {
        scanBlocked = totalUptime >= 5000000;
        break;
      }
      case 7: {
        scanBlocked = totalUptime >= 10000000;
        break;
      }
      case 8: {
        scanBlocked = totalUptime >= 20000000;
        break;
      }
      case 9: {
        scanBlocked = totalUptime >= 35000000;
        break;
      }
      case 10: {
        scanBlocked = totalUptime >= 60000000;
        break;
      }
      default: {
        scanBlocked = true;
        break;
      }
    }

    return !scanBlocked;
    // todo: custom usagelimit
    // user?.scanInfo?.usageLimit
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
