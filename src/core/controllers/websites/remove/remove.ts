import { connect } from "@app/database";
import {
  WEBSITE_NOT_FOUND,
  SUCCESS,
  SUCCESS_DELETED_ALL,
} from "@app/core/strings";
import { getWebsite } from "../find";
import { HistoryController } from "../../history";

export const removeWebsite = async ({ userId, url, deleteMany = false }) => {
  if (typeof userId === "undefined") {
    throw new Error(WEBSITE_NOT_FOUND);
  }

  const [scriptsCollection] = await connect("Scripts");
  const [analyticsCollection] = await connect("Analytics");
  const [subdomainsCollection] = await connect("SubDomains");
  const [issuesCollection] = await connect("Issues");

  if (deleteMany) {
    const [webcollection] = await connect("Websites");
    await webcollection.deleteMany({ userId });
    await scriptsCollection.deleteMany({ userId });
    await analyticsCollection.deleteMany({ userId });
    await subdomainsCollection.deleteMany({ userId });
    await issuesCollection.deleteMany({ userId });

    return { code: 200, success: true, message: SUCCESS_DELETED_ALL };
  }

  const [siteExist, collection] = await getWebsite({ userId, url });

  if (!siteExist) {
    throw new Error(WEBSITE_NOT_FOUND);
  }

  const deleteQuery = { domain: siteExist?.domain, userId };

  const [history, historyCollection] = await HistoryController().getHistoryItem(
    deleteQuery,
    true
  );

  await scriptsCollection.deleteMany(deleteQuery);
  await analyticsCollection.deleteMany(deleteQuery);
  await subdomainsCollection.deleteMany(deleteQuery);
  await issuesCollection.deleteMany(deleteQuery);
  await collection.findOneAndDelete(deleteQuery);

  // PREVENT DUPLICATE ITEMS IN HISTORY
  if (!history) {
    if ((await historyCollection.countDocuments({ userId })) >= 20) {
      await historyCollection.deleteOne({ userId });
    }
    await historyCollection.insertOne({
      ...siteExist,
      deletedDate: new Date(),
    });
  }

  return { website: siteExist, code: 200, success: true, message: SUCCESS };
};
