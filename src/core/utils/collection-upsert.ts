import type { Collection, Document } from "mongodb";

/*
 * Update or add item into collection - some values are autofilled if empty.
 * This method acts as a collection upsert with delete for any collection.
 * @param source: target updating
 * @param [collection, shouldUpdate, shouldDelete]: handle the updating of collection - deleting requires update + delete
 * @param config: Object. set the key [searchProps]: search the db with the keys and values set
 */
export const collectionUpsert = async (
  source: any,
  [collection, shouldUpdate, shouldDelete]: [Collection<Document>, any, any?],
  config?: any
) => {
  if (typeof source === "undefined") {
    return Promise.resolve();
  }
  const userId = config?.searchProps?.userId ?? source?.userId;
  const pageUrl = config?.searchProps?.pageUrl || source?.pageUrl;
  const url = config?.searchProps?.url || source?.url;
  const domain = config?.searchProps?.domain || source?.domain;

  let queryParams = {};

  if (typeof userId !== "undefined") {
    queryParams = { userId };
  }

  if (pageUrl) {
    queryParams = { ...queryParams, pageUrl };
  }

  if (url && !pageUrl) {
    queryParams = { ...queryParams, url };
  }

  if (domain) {
    queryParams = { ...queryParams, domain };
  }

  if (shouldUpdate && shouldDelete) {
    return await collection.deleteOne(queryParams); // delete the record when update & delete
  }

  if (!shouldUpdate) {
    return await collection.insertOne(source);
  }

  if (shouldUpdate === "many") {
    return await collection.updateMany(queryParams, { $set: source });
  }

  return await collection.updateOne(queryParams, { $set: source });
};

/*
 * Increment a collection property value
 * @param source: target updating the key of the property with the new number to increment by
 * @param collection: handle the updating of collection - deleting requires update + delete
 * @param searchProps: The object to find in the collection by
 */
export const collectionIncrement = async (
  source: any,
  collection: any,
  searchProps: Record<any, any>
) => {
  if (typeof source === "undefined") {
    return Promise.resolve();
  }
  return await collection.updateOne(
    searchProps,
    {
      $inc: source,
    },
    { upsert: true }
  );
};
