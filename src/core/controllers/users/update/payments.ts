/*
 * Copyright (c) A11yWatch, LLC. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 **/

import { config } from "@app/config";

import { EMAIL_ERROR, SUCCESS } from "../../../strings";
import { signJwt } from "../../../utils";
import { getUser } from "../find";

const {
  STRIPE_KEY,
  STRIPE_PREMIUM_PLAN,
  STRIPE_PREMIUM_PLAN_YEARLY,
  STRIPE_BASIC_PLAN,
  STRIPE_BASIC_PLAN_YEARLY,
} = config;

const stripe = require("stripe")(STRIPE_KEY);

export const addPaymentSubscription = async ({
  keyid,
  email: emailP,
  stripeToken,
  yearly,
}: {
  keyid?: number;
  email?: string;
  stripeToken: string;
  yearly?: boolean;
}) => {
  const [user, collection] = await getUser({ email: emailP, id: keyid }, true);
  const email = user?.email ?? emailP;

  if (user && stripeToken) {
    const parsedToken = JSON.parse(stripeToken);

    let customer = !user.stripeID
      ? await stripe.customers.create({
          email,
        })
      : { id: user.stripeID };

    if (user.stripeID) {
      customer = await stripe.customers.retrieve(user.stripeID);
      if (customer.deleted) {
        customer = await stripe.customers.create({
          email,
        });
      }
    }

    if (customer) {
      const stripeCustomer = await stripe.customers.createSource(customer.id, {
        source: parsedToken.id,
      });

      let plan = yearly ? STRIPE_BASIC_PLAN_YEARLY : STRIPE_BASIC_PLAN;

      if (parsedToken.plan === 1) {
        plan = yearly ? STRIPE_PREMIUM_PLAN_YEARLY : STRIPE_PREMIUM_PLAN;
      }

      const charge = await stripe.subscriptions.create({
        customer: stripeCustomer.customer,
        items: [
          {
            plan,
          },
        ],
      });

      if (charge) {
        // TODO: GET ROLE DETERMINATION ANOTHER WAY
        const role = [999, 9999, "999", "9999"].includes(charge.plan.amount)
          ? 1
          : [1999, 19999, "1999", "19999"].includes(charge.plan.amount)
          ? 2
          : user.role;

        const jwt = signJwt({ email, role, keyid: user.id });

        user.jwt = jwt;
        user.role = role;
        user.paymentSubscription = charge;

        if (customer.id) {
          user.stripeID = customer.id;
        }

        await collection.updateOne(
          { id: keyid },
          {
            $set: {
              stripeToken,
              jwt,
              role,
              stripeID: customer.id,
              paymentSubscription: charge,
            },
          }
        );
      }
    }

    return {
      user,
      code: 200,
      success: true,
      message: SUCCESS,
    };
  }

  return { code: 404, success: false, message: EMAIL_ERROR };
};

export const cancelSubscription = async ({ keyid }) => {
  const [user, collection] = await getUser({ id: keyid }, true);

  if (!user) {
    throw new Error(EMAIL_ERROR);
  }

  if (user && user.stripeID) {
    const customer = await stripe.customers.retrieve(user.stripeID);
    if (
      customer &&
      customer.subscriptions &&
      customer.subscriptions.data.length
    ) {
      const deletedSubscription = customer.subscriptions.data.every((item) => {
        return stripe.subscriptions.del(item.id);
      });

      if (deletedSubscription) {
        const jwt = signJwt({
          email: user?.email,
          role: 0,
          keyid: user.id,
        });

        user.jwt = jwt;
        user.role = 0;

        await collection.updateOne(
          { email: user?.email },
          {
            $set: {
              jwt,
              role: 0,
              lastRole: user.role,
              paymentSubscription: false,
            },
          }
        );
      }
    }
  }

  return {
    user,
    code: 200,
    success: true,
    message: SUCCESS,
  };
};
