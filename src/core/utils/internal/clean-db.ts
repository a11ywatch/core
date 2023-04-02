import { pagesCollection, websitesCollection } from "../../../database";

// [Internal] method to cleanup invalid domain adds & params fields to remove { html : "" }
export const cleanUpDeprecatedFields = async (fields) => {
  if (!fields) {
    return Promise.reject(
      "Fields requires a object with properties to remove."
    );
  }
  await pagesCollection.updateMany({}, { $unset: fields });
  await websitesCollection.updateMany({}, { $unset: fields });
};
