import { getUser } from "../find";
import { GENERAL_ERROR, SUCCESS } from "../../../strings";

const toggleAlert = async ({ keyid: id, alertEnabled }) => {
  try {
    const [user, collection] = await getUser({ id });

    if (user) {
      await collection.updateOne({ id }, { $set: { alertEnabled } });
      return {
        alertEnabled,
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

export { toggleAlert };
