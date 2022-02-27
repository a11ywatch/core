import { getUser } from "../find";
import { isSameDay } from "date-fns";

export const updateScanAttempt = async ({ userId }) => {
  const [user, collection] = await getUser({ id: userId });

  if (user) {
    const lastScanDate = new Date();

    let scanInfo = user?.scanInfo
      ? user?.scanInfo
      : {
          lastScanDate,
          scanAttempts: 0,
        };

    scanInfo.scanAttempts =
      scanInfo?.lastScanDate &&
      !isSameDay(scanInfo?.lastScanDate as Date, new Date())
        ? 1
        : scanInfo.scanAttempts + 1;

    if (
      (scanInfo?.scanAttempts >= 3 && user?.role === 0) ||
      (scanInfo?.scanAttempts > 10 && user?.role === 1)
    ) {
      return false;
    }

    scanInfo.lastScanDate = lastScanDate;

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
