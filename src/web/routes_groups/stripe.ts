import type { FastifyInstance } from "fastify";
import { config } from "../../config";
import { stripe } from "../../core/external";
import { UsersController, WebsitesController } from "../../core/controllers";

// stripe web hook routes
export const setStripeRoutes = (app: FastifyInstance) => {
  app.post("/api/stripes/event", async (req, res) => {
    let event;

    try {
      event = await stripe.webhooks.constructEventAsync(
        req.rawBody,
        req.headers["stripe-signature"],
        config.STRIPE_WH_SECRET
      );
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    let statusCode = 200;
    const { object: stripeCustomer } = event?.data ?? {};

    switch (event.type) {
      case "customer.subscription.deleted": {
        const [user, collection] = await UsersController().getUser({
          email: stripeCustomer.email,
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
        // determine next payment
        if (
          ["manual", "subscription_cycle", "subscription_update"].includes(
            stripeCustomer.billing_reason
          )
        ) {
        }
        break;
      }
      case "customer.created": {
        break;
      }

      default: {
        statusCode = 200;
      }
    }

    res.status(statusCode).send(true);
  });
};
