/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import { getPayLoad } from "../../utils/query-payload";

export const addPaymentSubscription = async (
  _,
  { stripeToken, yearly },
  context
) => {
  const { userId: keyid, audience } = getPayLoad(context);

  return await context.models.User.addPaymentSubscription({
    keyid,
    audience,
    stripeToken,
    yearly,
  });
};
export const cancelSubscription = async (_, { email }, context) => {
  const { userId: keyid, audience } = getPayLoad(context);

  return await context.models.User.cancelSubscription({
    keyid,
    audience,
    email,
  });
};
