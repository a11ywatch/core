/*
 * update or add item into collection - some values are autofilled if empty
 * @param source: target updating
 * @param [collection, shouldUpdate, shouldDelete]: handle the updating of collection - deleting requires update + delete
 * @param config: search the db with the keys and values set
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

    // mainly if issues exist and theres none on the page (delete the collection)
    if (shouldUpdate && shouldDelete) {
      return await collection.deleteOne(queryParams);
    }

    if (!shouldUpdate) {
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
