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

import Stripe from "stripe";

export const stripe = new Stripe(STRIPE_KEY, {
  telemetry: false,
});

// add payment subscription between basic and premium plans. Does not work with entrprise.
export const addPaymentSubscription = async ({
  keyid,
  email: emailP,
  stripeToken,
  yearly,
}: {
  keyid?: number;
  email?: string;
  stripeToken: string; // returned from client upon success credit card submit
  yearly?: boolean;
}) => {
  const [user, collection] = await getUser({ email: emailP, id: keyid });
  const email = user?.email ?? emailP;

  if (user && stripeToken) {
    const parsedToken = JSON.parse(stripeToken);

    let customer = !user.stripeID
      ? await stripe.customers.create({
          email,
        })
      : { id: user.stripeID };

    if (user.stripeID) {
      try {
        customer = await stripe.customers.retrieve(user.stripeID);
      } catch (e) {
        console.error(e);
      }
      // if customer not found on re-sub re-create user
      if (!customer) {
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
        const chargeAmount = String(charge.plan.amount);
        let role = user.role;
        let websiteLimit = user.websiteLimit;

        // TODO: determine another way off price
        if ("999" === chargeAmount || "9999" === chargeAmount) {
          role = 1;
          websiteLimit = 4;
        } else if ("1999" === chargeAmount || "19999" === chargeAmount) {
          role = 2;
          websiteLimit = 10;
        }

        const jwt = signJwt({ email, role, keyid: user.id });

        user.jwt = jwt;
        user.role = role;
        user.paymentSubscription = charge;

        if (customer.id) {
          user.stripeID = customer.id;
        }

        await collection.updateOne(
          { id: user.id },
          {
            $set: {
              stripeToken,
              jwt,
              role,
              stripeID: customer.id,
              paymentSubscription: charge,
              websiteLimit,
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
  const [user, collection] = await getUser({ id: keyid });

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

// get the users upcoming invoice
export const viewUpcomingInvoice = async ({ userId }) => {
  // if key not found exit
  if (userId === "undefined") {
    return Promise.resolve(null);
  }

  const [user] = await getUser({ id: userId });

  if (!user) {
    throw new Error(EMAIL_ERROR);
  }

  if (user && user.stripeID) {
    const invoice = await stripe.invoices
      .retrieveUpcoming({
        customer: user.stripeID,
      })
      .catch((e) => {
        console.error(e);
      });

    return invoice;
  }
};
