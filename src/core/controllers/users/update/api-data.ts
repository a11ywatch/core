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

    // set the initial usage to 0 to inc bellow
    const defaultUsage = user?.apiUsage?.usage || 0;

    const lastScan = user?.apiUsage?.lastScanDate || lastScanDate;

    // API LIMITS HARD_CODED TODO: MOVE TO DB
    const maxLimit = user.role === 0 ? 3 : user.role === 1 ? 100 : 500;

    // super mode defaults to 0 allowing all for every request
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
