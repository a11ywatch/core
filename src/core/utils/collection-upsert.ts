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
    const queryParams = config?.searchProps
      ? config?.searchProps
      : // default handle collections as pageURL. SHOULD REFACTOR single prop `url`
        { userId, pageUrl: config?.searchProps?.pageUrl || source?.pageUrl };

    if (typeof queryParams?.pageUrl === "undefined" && !queryParams.url) {
      queryParams.url = source?.url;
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
