import { getUser } from "../find";
import { SUCCESS, AUTH_ERROR } from "../../../strings";

// set whether users get emailed on events
const toggleAlert = async ({ keyid: id, alertEnabled }) => {
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

  return {
    alertEnabled,
    code: 403,
    success: false,
    message: AUTH_ERROR,
  };
};

export { toggleAlert };
