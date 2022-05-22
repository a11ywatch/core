/*
 * Update or add item into collection - some values are autofilled if empty.
 * This method acts as a collection upsert with delete for any collection.
 * @param source: target updating
 * @param [collection, shouldUpdate, shouldDelete]: handle the updating of collection - deleting requires update + delete
 * @param config: Object. set the key [searchProps]: search the db with the keys and values set
 */
export const collectionUpsert = async (
  source: any,
  [collection, shouldUpdate, shouldDelete]: [any, any, any?],
  config?: any
) => {
  if (typeof source === "undefined") {
    return Promise.resolve();
  }
  try {
    const userId = config?.searchProps?.userId || source?.userId;
    const pageUrl = config?.searchProps?.pageUrl || source?.pageUrl;

    const queryParams = config?.searchProps
      ? config?.searchProps
      : // default handle collections as pageURL. SHOULD REFACTOR single prop `url`
        { userId, pageUrl };

    if (typeof queryParams?.pageUrl === "undefined" && !queryParams.url) {
      if (source?.url) {
        queryParams.url = source.url;
      } else if (source.pageUrl) {
        queryParams.pageUrl = source.pageUrl;
      }
    }

    if (shouldUpdate && shouldDelete) {
      // delete the record when update & delete
      return await collection.deleteOne(queryParams);
    } else if (!shouldUpdate) {
      return await collection.insertOne(source);
    } else if (shouldUpdate === "many") {
      return await collection.updateMany(queryParams, { $set: source });
    } else {
      return await collection.updateOne(queryParams, { $set: source });
    }
  } catch (e) {
    console.error(e);
  }
};
