/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/
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
            emailAlerts: false,
            alertEnabled: false,
          },
        }
      );
    } else {
      console.info("USER: not found");
    }
  } catch (e) {
    console.error(e);
  }

  return true;
};
