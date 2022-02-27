import { getUser } from "../find";
import { isSameDay } from "date-fns";

export const updateApiUsage = async (
  { email, id, emailConfirmCode },
  chain?: boolean
) => {
  try {
    const [user, collection] = await getUser({ id });
    if (!user) {
      return chain ? [user, collection] : user;
    }

    const maxLimit = user.role === 0 ? 3 : user.role === 1 ? 100 : 500;
    const currentUsage = user?.apiUsage?.usage || 1;
    const blockScan = currentUsage >= maxLimit;

    let resetData = false;

    const lastScanDate = new Date();

    const lastScan = user?.apiUsage?.lastScanDate || new Date();

    if (!isSameDay(lastScan as Date, lastScanDate)) {
      resetData = true;
    }

    if (blockScan && !resetData) {
      return chain ? [user, collection] : user;
    }

    const updateCollectionProps = !resetData
      ? {
          apiUsage: { usage: user?.apiUsage?.usage + 1, lastScanDate },
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
