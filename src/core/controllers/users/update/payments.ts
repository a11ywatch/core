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

const trialPeriod = process.env.TRIAL_PERIOD ? parseInt(process.env.TRIAL_PERIOD, 10): 14;

// add payment subscription between basic and premium plans. Does not work with entrprise.
export const addPaymentSubscription = async ({
  keyid,
  email: emailP,
  stripeToken,
  yearly,
}: AddPaymentProps) => {
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
      // todo: use customer returned from source
      await stripe.customers.createSource(customer.id, {
        source: parsedToken.id,
      });

      const plan = parsedToken.plan;
      const stripeProductPlan = stripeProductId(plan, yearly);

      const charge = await stripe.subscriptions.create({
        customer: customer.id,
        items: [
          {
            plan: stripeProductPlan,
          },
        ],
        trial_period_days: trialPeriod
      });

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
  const [user, collection] = await getUser({ id: keyid });

  if (!user) {
    throw new Error(EMAIL_ERROR);
  }

  if (user?.stripeID) {
    const customer = await stripe.subscriptions.list({
      customer: user.stripeID,
    });

    const subscriptions = customer?.data;

    if (subscriptions && subscriptions.length) {
      const deletedSubscription = subscriptions.every((item) => {
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
