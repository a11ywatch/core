import { getUser } from "../find";
import { SUCCESS } from "../../../strings";

const toggleProfile = async ({ keyid: id, profileVisible }) => {
  const [user, collection] = await getUser({ id });

  if (user) {
    await collection.updateOne({ id }, { $set: { profileVisible } });
  }

  return {
    profileVisible,
    code: 200,
    success: true,
    message: SUCCESS,
  };
};

export { toggleProfile };
