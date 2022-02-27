import { getUser } from "../find";

export const unsubscribeEmails = async ({ id, email }) => {
  try {
    // TODO: remove collection find
    const [user, collection] = await getUser({ id, email }, true);

    if (user) {
      await collection.findOneAndUpdate(
        { id },
        {
          $set: {
            alertEnabled: false,
          },
        }
      );
    } else {
      console.log(`UNSUBSCRIBE FAILED - ID:${id}, Email:${email}`);
    }
  } catch (e) {
    console.error(e);
  }

  return true;
};
