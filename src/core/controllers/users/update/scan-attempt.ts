import { getUser } from "../find";
import { isSameDay } from "date-fns";
import { SUPER_MODE } from "@app/config/config";

// Determine if user can perform multi-site scan
export const updateScanAttempt = async ({ userId }) => {
  let user;
  let collection;

  // if SUPER_MODE always return truthy
  if (SUPER_MODE) {
    return true;
  }

  try {
    [user, collection] = await getUser({ id: userId });
  } catch (e) {
    console.error(e);
  }

  if (user) {
    const scanInfo = user?.scanInfo ?? {
      lastScanDate: undefined as Date,
      scanAttempts: 0,
      usageLimit: 0,
    };

    const role = user?.role;
    const currentDate = new Date();

    if (!isSameDay(scanInfo?.lastScanDate, currentDate)) {
      scanInfo.scanAttempts = 0;
    }

    // increment scan attempt
    scanInfo.scanAttempts = scanInfo.scanAttempts + 1;

    if (!role && scanInfo?.scanAttempts >= 3) {
      return false;
    }
    if (role === 1 && scanInfo?.scanAttempts >= 10) {
      return false;
    }
    if (role === 2 && scanInfo?.scanAttempts >= 100) {
      return false;
    }
    // default to max if none set for entreprise
    if (
      role === 3 &&
      scanInfo?.scanAttempts >= (user?.scanInfo?.usageLimit || 100)
    ) {
      return false;
    }

    scanInfo.lastScanDate = currentDate;

    try {
      await collection.findOneAndUpdate(
        { id: user.id },
        { $set: { scanInfo } }
      );
    } catch (e) {
      console.error(e);
    }

    // succeeded can scan
    return true;
  }

  return false;
};

/*
 * @param {userId: number}
 * determine if user has muti site scans enabled
 */
export const getScanEnabled = async ({ userId }) => {
  const [user] = await getUser({ id: userId });

  const scanAttempts = user?.scanInfo?.scanAttempts ?? 0;
  const role = user?.role; // users role

  if (
    !user ||
    (role === 0 && scanAttempts >= 3) ||
    (role === 1 && scanAttempts >= 10) ||
    (role === 2 && scanAttempts >= 100) ||
    (role == 3 && scanAttempts >= (user?.scanInfo?.usageLimit || 100))
  ) {
    return false;
  }

  return true;
};
