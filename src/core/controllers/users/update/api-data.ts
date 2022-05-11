import { getUser } from "../find";
import { isSameDay } from "date-fns";
import { SUPER_MODE } from "@app/config/config";

/*
 * @param {id}: number|string user identifier
 * Update the API usage from the central API.
 * Increments user.apiUsage?.usage every time
 * and has reset detection if next day.
 */
export const updateApiUsage = async ({ id }, chain?: boolean) => {
  let user;
  let collection;

  try {
    [user, collection] = await getUser({ id });
  } catch (e) {
    console.error(e);
  }

  if (!user || SUPER_MODE) {
    return chain ? [user, collection] : user;
  }

  // current day or the next scan
  const lastScanDate = new Date();
  // if api was used get the last date otherwise set to current
  const lastScan = user?.apiUsage?.lastScanDate || lastScanDate;

  // API LIMITS HARD_CODED TODO: MOVE TO DB
  let maxLimit = user.role === 0 ? 3 : user.role === 1 ? 100 : 500;

  // user has custom limit assigned. Default to max
  if (user.role === 3 && user.apiUsage?.usageLimit > maxLimit) {
    maxLimit = user.apiUsage?.usageLimit;
  }

  let currentUsage = user?.apiUsage?.usage || 0;

  // if not the same day reset the user back to its limit
  if (!isSameDay(lastScan as Date, lastScanDate)) {
    currentUsage = 0;
  }

  // current usage exceeds the max limit block request
  if (currentUsage >= maxLimit) {
    return chain ? [user, collection] : user;
  }

  // get previus user usage
  const apiUsageData = user?.apiUsage;

  const updateCollectionProps = {
    apiUsage: {
      ...apiUsageData, // retain defaults besides usage - and last scan
      usage: currentUsage + 1,
      lastScanDate,
    },
  };

  user.apiUsage = {
    ...updateCollectionProps.apiUsage,
    lastScanDate: lastScanDate + "",
  };

  try {
    await collection.updateOne({ id }, { $set: updateCollectionProps });
  } catch (e) {
    console.error(e);
  }

  return chain ? [user, collection] : user;
};
