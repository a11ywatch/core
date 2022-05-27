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
    let i = 0;
    order.forEach(async (item) => {
      const query = { userId, domain: item };
      i = i + 1;
      const update = { $set: { order: i - 1 } };
      await collection.updateOne(query, update);
    });
  }

  return {
    code: 200,
    success: true,
    message: SUCCESS,
  };
};
