import { getUser } from "../find";
import { GENERAL_ERROR, SUCCESS } from "../../../strings";

const toggleProfile = async ({ keyid: id, profileVisible }) => {
  try {
    const [user, collection] = await getUser({ id });

    if (user) {
      await collection.updateOne({ id }, { $set: { profileVisible } });
      return {
        profileVisible,
        code: 200,
        success: true,
        message: SUCCESS,
      };
    }
  } catch (e) {
    console.error(e);
    throw new Error(GENERAL_ERROR);
  }
};

export { toggleProfile };
