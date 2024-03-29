import { SUCCESS } from "../../../strings";
import { websitesCollection } from "../../../../database";

export const sortWebsites = async ({ userId, order = [] }) => {
  if (!order.length) {
    throw new Error("Order required");
  }

  if (order && order.length) {
    for (let i = 0; i < order.length; i++) {
      const item = order[i];
      const query = { userId, domain: item };
      const update = { $set: { order: i } };
      await websitesCollection.updateOne(query, update);
    }
  }

  return {
    code: 200,
    success: true,
    message: SUCCESS,
  };
};
