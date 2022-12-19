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
};

const trialPeriod = process.env.TRIAL_PERIOD
  ? parseInt(process.env.TRIAL_PERIOD, 10)
  : 14;

// add payment subscription between basic and premium plans. Does not work with entrprise.
export const addPaymentSubscription = async ({
  keyid,
  email: emailP,
  stripeToken, // contains the plan for the mutation - todo: split param off the stripe token
  yearly,
}: AddPaymentProps) => {
  const [user, collection] = await getUser({ email: emailP, id: keyid });
  const email = user?.email ?? emailP;

  // todo: make stripe token optional and prevent storing to db
  if (user && stripeToken) {
    let parsedToken = null;

    if (stripeToken) {
      try {
        parsedToken = JSON.parse(stripeToken);
      } catch (e) {
        console.error(e);
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

    // params used to create the user
    const createParams = parsedToken?.referral
      ? {
          email,
          metadata: {
            referral: parsedToken.referral,
          },
        }
      : {
          email,
          metadata: null,
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
        customer = await stripe.customers.create(createParams);
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

      const plan = parsedToken?.plan;
      const stripeProductPlan = stripeProductId(plan, yearly);
      const activeSub = user?.paymentSubscription;
      const upgradeAccount =
        activeSub?.status === "trialing" || activeSub?.status === "active";

      let charge = null;

      // remove prior subscriptions
      if (upgradeAccount) {
        try {
          if (activeSub?.status === "trialing") {
            charge = await stripe.subscriptions.update(activeSub.id, {
              proration_behavior: "always_invoice",
              cancel_at_period_end: false,
              items: [
                {
                  id: activeSub.items.data[0].id,
                  price: stripeProductPlan,
                },
              ],
              trial_end: "now",
            });
          } else {
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
          }
        } catch(e) {
          console.error(e)
        }
      }

      // create new sub
      if(!charge) {
        charge = await stripe.subscriptions.create({
          customer: customer.id,
          items: [
            {
              plan: stripeProductPlan,
            },
          ],
          trial_period_days: !activeSub ? trialPeriod : undefined,
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
export const cancelSubscription = async ({ keyid }) => {
  const [user, collection] = await getUser({ id: keyid });

  if (!user) {
    throw new Error(EMAIL_ERROR);
  }

  if (user?.stripeID) {
    const deletedSubscription = await removeUserSubscriptions(user.stripeID);

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
