import { config } from "../../../../config";

import { EMAIL_ERROR, SUCCESS } from "../../../strings";
import { signJwt } from "../../../utils";
import { roleHandler, stripeProductId } from "../../../utils/price-handler";
import { getUser } from "../find";

const { STRIPE_KEY } = config;

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
    let parsedToken = null;

    try {
      parsedToken = JSON.parse(stripeToken);
    } catch (e) {
      console.error(e);
    }

    if (!parsedToken) {
      return {
        user,
        code: 400,
        success: false,
        message: "Error invalid stripe token.",
      };
    }

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
        source: parsedToken?.id,
      });

      const plan = parsedToken?.plan;

      const stripeProductPlan = stripeProductId(plan, yearly);

      const charge = await stripe.subscriptions.create({
        customer: stripeCustomer.customer,
        items: [
          {
            plan: stripeProductPlan,
          },
        ],
      });

      if (charge) {
        const role = roleHandler(plan);
        const jwt = signJwt({ email, role, keyid: user.id });

        user.jwt = jwt;
        user.role = role;
        user.paymentSubscription = charge;
        user.stripeID = customer.id;

        await collection.updateOne(
          { id: user.id },
          {
            $set: {
              stripeToken,
              jwt,
              role,
              stripeID: customer.id,
              paymentSubscription: charge,
              websiteLimit: 50,
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

  if (user?.stripeID) {
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
