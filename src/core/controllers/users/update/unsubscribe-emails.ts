import { getUser } from "../find";

export const unsubscribeEmails = async ({ id, email }) => {
  const [user, collection] = await getUser({ id, email });

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
    console.error(`UNSUBSCRIBE FAILED - ID:${id}, Email:${email}`);
  }

  return true;
};
