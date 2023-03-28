import type { Collection, Document } from "mongodb";
import { buildQueryParams } from "./q";

/*
 * Update or add item into collection - some values are autofilled if empty.
 * This method acts as a collection upsert with delete for any collection.
 * @param source: target updating
 * @param [collection, shouldUpdate, shouldDelete]: handle the updating of collection - deleting requires update + delete
 * @param config: Object. set the key [searchProps]: search the db with the keys and values set
 */
export const collectionUpsert = async (
  source: any,
  [collection, shouldUpdate, shouldDelete]: [
    Collection<Document>,
    boolean | "upsert" | "many",
    any?
  ],
  config?: any
) => {
  if (typeof source === "undefined" || !collection) {
    return Promise.resolve();
  }

  const queryParams = buildQueryParams(config?.searchProps ?? source);

  if (shouldUpdate && shouldDelete) {
    return await collection.deleteOne(queryParams); // delete the record when update & delete
  }

  if (!shouldUpdate) {
    return await collection.insertOne(source);
  }

  if (shouldUpdate === "many") {
    return await collection.updateMany(queryParams, { $set: source });
  }

  return await collection.updateOne(
    queryParams,
    { $set: source },
    {
      upsert: shouldUpdate === "upsert",
    }
  );
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
  if (typeof source === "undefined" || !collection) {
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
