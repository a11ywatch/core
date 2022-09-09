import { connect } from "../../../database";

// [Internal] method to cleanup invalid domain adds & params fields to remove { html : "" }
export const cleanUpDeprecatedFields = async (fields) => {
  if (!fields) {
    return Promise.reject(
      "Fields requires a object with properties to remove."
    );
  }
  const [collection] = await connect("Pages");
  const [websiteCollection] = await connect("Websites");

  await collection.updateMany({}, { $unset: fields });

  await websiteCollection.updateMany({}, { $unset: fields });
};
