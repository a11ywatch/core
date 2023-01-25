import { EMAIL_ERROR, SUCCESS } from "../../../strings";
import { signJwt } from "../../../utils";
import { roleHandler, stripeProductId } from "../../../utils/price-handler";
import { getUser } from "../find";
import { stripe } from "../../../external/stripe";
import type { User } from "../../../../types/schema";

type AddPaymentProps = {
  keyid?: number;
  email?: string;
  stripeToken: string; // returned from client upon success credit card submit [todo: convert object]
  yearly?: boolean;
  paymentPlan?: string; // valid payment plan
};

// add payment subscription between plans.
export const addPaymentSubscription = async ({
  keyid,
  email: emailP,
  stripeToken, // contains the plan for the mutation - todo: split param off the stripe token
  yearly,
  paymentPlan,
}: AddPaymentProps) => {
  const [user, collection] = await getUser({ email: emailP, id: keyid });
  const email = user?.email ?? emailP;

  if (user && stripeToken) {
    let parsedToken = null;

    if (stripeToken) {
      // parse token string
      if (typeof stripeToken === "string") {
        try {
          parsedToken = JSON.parse(stripeToken);
        } catch (e) {
          console.error(e);
        }
      } else {
        parsedToken = stripeToken;
      }

      if (!parsedToken && !user.stripeID) {
        return {
          user,
          code: 400,
          success: false,
          message: "Error invalid stripe token.",
        };
      }
    }
    // todo: remove plan from token
    const plan = parsedToken?.plan ?? paymentPlan ?? "L1";

    // params used to create the user
    const createParams = {
      email,
    };

    let customer = { id: user.stripeID };

    // create the new stripe customer
    if (!user.stripeID) {
      customer = await stripe.customers.create(createParams);
    } else {
      // get the customer from stripe
      try {
        customer = await stripe.customers.retrieve(user.stripeID);
      } catch (e) {
        console.error(e);
      }
      // if customer not found on re-sub re-create user
      if (!customer) {
        try {
          customer = await stripe.customers.create(createParams);
        } catch (e) {
          console.error(e);
        }
      }
    }

    // customer created continue with source
    if (customer) {
      // collecting the card for first time card re-uses do not return id in object
      if (parsedToken?.id) {
        try {
          await stripe.customers.createSource(customer.id, {
            source: parsedToken.id,
          });
        } catch (e) {
          console.error(e);
        }
      }

      const stripeProductPlan = stripeProductId(plan, yearly);
      const activeSub = user?.paymentSubscription;
      const upgradeAccount = activeSub?.status === "active";

      let charge = null;

      // remove prior subscriptions
      if (upgradeAccount) {
        try {
          charge = await stripe.subscriptions.update(activeSub.id, {
            proration_behavior: "create_prorations",
            cancel_at_period_end: false,
            items: [
              {
                id: activeSub.items.data[0].id,
                price: stripeProductPlan,
              },
            ],
          });
        } catch (e) {
          console.error(e);
        }
      }

      // create new sub
      if (!charge) {
        charge = await stripe.subscriptions.create({
          customer: customer.id,
          items: [
            {
              plan: stripeProductPlan,
            },
          ],
        });
      }

      if (charge) {
        const role = roleHandler(plan);
        const jwt = signJwt({ email, role, keyid: user.id });

        // todo: prevent mutation
        user.jwt = jwt;
        user.role = role;
        user.paymentSubscription = charge;
        user.stripeID = customer.id;

        await collection.updateOne(
          { id: user.id },
          {
            $set: {
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

// revert account to basic
export const cancelSubscription = async ({ keyid }, blockUpdate?: boolean) => {
  const [user, collection] = await getUser({ id: keyid });

  if (!user) {
    throw new Error(EMAIL_ERROR);
  }

  if (user?.stripeID) {
    const deletedSubscription = await removeUserSubscriptions(user.stripeID);

    // blockUpdate to prevent waisting resources on account delete
    if (deletedSubscription && !blockUpdate) {
      const jwt = signJwt({
        email: user.email,
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
            paymentSubscription: false, // set to false to determine was active
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

  // todo: remove stripe bind on cancel sub
  if (user && user.role && user.stripeID) {
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

// perform a user downgrade does not perform outside collection side effects
// @params {user, collection} prior user and collection
export const downgradeStripeUserValues = async ({
  user,
  collection,
}: {
  user: User;
  collection: any;
}) => {
  const email = user.email;
  const jwt = signJwt({
    email,
    role: 0,
    keyid: user.id,
  });
  await collection.updateOne(
    { email },
    {
      $set: {
        jwt,
        role: 0,
        lastRole: user.role,
        paymentSubscription: false,
      },
    }
  );
};

// delete stripe subs by user
const removeUserSubscriptions = async (stripeID: string) => {
  const customer = await stripe.subscriptions.list({
    customer: stripeID,
  });
  const subscriptions = customer?.data;

  let deletedSubscription = false;
  if (subscriptions && subscriptions.length) {
    deletedSubscription = subscriptions.every(async (item) => {
      try {
        return await stripe.subscriptions.del(item.id);
      } catch (e) {
        console.error(e);
      }
    });
  }

  return deletedSubscription;
};
