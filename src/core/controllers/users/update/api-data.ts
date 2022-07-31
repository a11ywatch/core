import { getUser } from "../find";
import { isSameDay } from "date-fns";
import { SUPER_MODE } from "@app/config/config";
import { usageExceededThreshold } from "@app/core/utils";

/*
 * @param {id}: number|string user identifier
 * Update the API usage from the central API.
 * Increments user.apiUsage?.usage every time
 * and has reset detection if next day.
 */
export const updateApiUsage = async ({ id }) => {
  let user;
  let collection;

  try {
    [user, collection] = await getUser({ id });
  } catch (e) {
    console.error(e);
  }

  if (!user || SUPER_MODE) {
    // return true for api request allowed
    return [user, collection, SUPER_MODE];
  }

  const { role, apiUsage } = user;

  // current day or the next scan
  const lastScanDate = new Date();
  // if api was used get the last date otherwise set to current

  let currentUsage = apiUsage?.usage || 0;

  // if not the same day reset the user back to its limit
  if (!isSameDay(apiUsage?.lastScanDate as Date, lastScanDate)) {
    currentUsage = 0;
  }

  const blockScan = usageExceededThreshold({
    audience: role,
    usage: currentUsage,
    usageLimit: apiUsage?.usageLimit,
  });

  // current usage exceeds the max limit block request
  if (blockScan) {
    return [user, collection, false];
  }

  const updateCollectionProps = {
    apiUsage: {
      ...apiUsage, // retain defaults besides usage - and last scan
      usage: currentUsage + 1,
      lastScanDate,
    },
  };

  user.apiUsage = updateCollectionProps.apiUsage;

  try {
    await collection.updateOne({ id }, { $set: updateCollectionProps });
  } catch (e) {
    console.error(e);
  }

  return [user, collection, true];
};
