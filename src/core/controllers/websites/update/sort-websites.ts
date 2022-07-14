import { SUCCESS } from "@app/core/strings";
import { connect } from "@app/database";

export const sortWebsites = async ({ userId, order = [] }) => {
  let collection;

  if (!order.length) {
    throw new Error("Order required");
  }

  try {
    [collection] = await connect("Websites");
  } catch (e) {
    console.error(e);
  }

  if (order && order.length) {
    for (let i = 0; i < order.length; i++) {
      const item = order[i];
      const query = { userId, domain: item };
      const update = { $set: { order: i } };
      await collection.updateOne(query, update);
    }
  }

  return {
    code: 200,
    success: true,
    message: SUCCESS,
  };
};
