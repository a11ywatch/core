import { getUser } from "../find";
import { SUCCESS } from "../../../strings";

const toggleAlert = ({ keyid: id, alertEnabled }) => {
  setImmediate(async () => {
    const [user, collection] = await getUser({ id });
    if (user) {
      await collection.updateOne({ id }, { $set: { alertEnabled } });
    }
  });

  return {
    alertEnabled,
    code: 200,
    success: true,
    message: SUCCESS,
  };
};

export { toggleAlert };
