import { getUser } from "../find";
import { isSameDay } from "date-fns";
import { SUPER_MODE } from "@app/config/config";

export const updateApiUsage = async ({ id }, chain?: boolean) => {
  try {
    const [user, collection] = await getUser({ id });
    if (!user) {
      return chain ? [user, collection] : user;
    }
    const lastScanDate = new Date();
    const defaultUsage = user?.apiUsage?.usage || 1;
    const lastScan = user?.apiUsage?.lastScanDate || lastScanDate;

    const maxLimit = user.role === 0 ? 3 : user.role === 1 ? 100 : 500;

    const currentUsage = SUPER_MODE ? 0 : defaultUsage;

    const blockScan = currentUsage >= maxLimit;

    let resetData = false;

    if (!isSameDay(lastScan as Date, lastScanDate)) {
      resetData = true;
    }

    if (blockScan && !resetData) {
      return chain ? [user, collection] : user;
    }

    const updateCollectionProps = !resetData
      ? {
          apiUsage: { usage: currentUsage + 1, lastScanDate },
        }
      : { apiUsage: { usage: 1, lastScanDate } };

    user.apiUsage = {
      ...updateCollectionProps.apiUsage,
      lastScanDate: lastScan as string,
    };

    await collection.updateOne({ id }, { $set: updateCollectionProps });

    return chain ? [user, collection] : user;
  } catch (e) {
    console.error(e);
  }
};
