import { getUser } from "../find";
import { isSameDay } from "date-fns";

export const updateScanAttempt = async ({ userId }) => {
  const [user, collection] = await getUser({ id: userId });

  if (user) {
    const scanInfo = user?.scanInfo ?? {
      lastScanDate: undefined as Date,
      scanAttempts: 0,
    };

    if (
      scanInfo?.lastScanDate &&
      !isSameDay(scanInfo.lastScanDate, new Date())
    ) {
      scanInfo.scanAttempts = 1;
    } else {
      scanInfo.scanAttempts = scanInfo.scanAttempts + 1;
    }

    // return and prevent updating db after scan limits exceeded
    if (
      (scanInfo?.scanAttempts >= 3 && user?.role === 0) ||
      (scanInfo?.scanAttempts > 10 && user?.role === 1)
    ) {
      return false;
    }

    scanInfo.lastScanDate = new Date();
    await collection.findOneAndUpdate({ id: user.id }, { $set: { scanInfo } });

    return true;
  }

  return false;
};

export const getScanEnabled = async ({ userId }) => {
  const [user] = await getUser({ id: userId });
  const scanAttempts = user?.scanInfo?.scanAttempts ?? 0;

  if (
    !user ||
    (scanAttempts >= 3 && user?.role === 0) ||
    (scanAttempts > 10 && user?.role === 1)
  ) {
    return false;
  }

  return true;
};
