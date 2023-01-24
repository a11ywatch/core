import type { FastifyInstance } from "fastify";
import { config } from "../../config";
import { stripe } from "../../core/external";
import { UsersController, WebsitesController } from "../../core/controllers";
import Stripe from "stripe";
import { addMonths } from "date-fns";

// Data to use from stripe web hook [todo: types may be available on newer versions]
type StripeData = {
  object: { customer_email: string; email?: string; billing_reason: string };
};

export const stripeHook = async (req, res) => {
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      req.body.raw,
      req.headers["stripe-signature"],
      config.STRIPE_WH_SECRET
    );
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  let statusCode = 200;
  // todo: bind to stripe api version
  const { object: stripeCustomer } = (event?.data as StripeData) ?? {};

  const userEmail = stripeCustomer?.customer_email ?? stripeCustomer?.email;

  switch (event.type) {
    case "customer.subscription.deleted": {
      const [user, collection] = await UsersController().getUser({
        email: userEmail,
      });

      await WebsitesController().removeWebsite({
        userId: user.id,
        deleteMany: true,
      });

      await UsersController().downgradeStripeUserValues({
        user,
        collection,
      });
      break;
    }
    case "invoice.payment_succeeded": {
      if (
        ["manual", "subscription_cycle", "subscription_update"].includes(
          stripeCustomer.billing_reason
        )
      ) {
        const [user, collection] = await UsersController().getUser({
          email: userEmail,
        });

        if (user?.paymentSubscription?.status !== "active") {
          user.paymentSubscription.status = "active";
        }

        await collection.updateOne(
          { email: user.email },
          {
            $set:
              stripeCustomer.billing_reason === "subscription_cycle"
                ? {
                    paymentSubscription: user.paymentSubscription,
                    usageAnchorDate: user.usageAnchorDate
                      ? addMonths(user.usageAnchorDate, 1)
                      : new Date(),
                  }
                : {
                    paymentSubscription: user.paymentSubscription,
                  },
          }
        );
      }
      break;
    }

    case "customer.created": {
      const [user, collection] = await UsersController().getUser({
        email: userEmail,
      });

      await collection.updateOne(
        { email: user.email },
        {
          $set: {
            usageAnchorDate: new Date(),
          },
        }
      );

      break;
    }

    default: {
      statusCode = 200;
    }
  }

  res.status(statusCode).send(true);
};

// stripe web hook routes
export const setStripeRoutes = (app: FastifyInstance) => {
  app.post("/api/stripes/event", stripeHook);
};
