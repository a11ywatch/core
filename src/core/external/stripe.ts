import Stripe from "stripe";

import { config } from "../../config";

const { STRIPE_KEY } = config;

export const stripe = new Stripe(STRIPE_KEY, {
  telemetry: false,
  apiVersion: "2022-11-15",
});
