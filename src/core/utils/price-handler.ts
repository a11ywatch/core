// determine the price for a plan
export const priceHandler = (plan: string, yearly?: boolean) => {
  let price = 0;
  let q = (plan && typeof plan === "string" && plan.toUpperCase()) || "";

  switch (q) {
    case "L1": {
      price = 1400;
      break;
    }
    case "L2": {
      price = 2400;
      break;
    }
    case "L3": {
      price = 4400;
      break;
    }
    case "L4": {
      price = 5400;
      break;
    }
    case "L5": {
      price = 8400;
      break;
    }
    // high
    case "H1": {
      price = 9400;
      break;
    }
    case "H2": {
      price = 13400;
      break;
    }
    case "H3": {
      price = 19400;
      break;
    }
    case "H4": {
      price = 33400;
      break;
    }
    case "H5": {
      price = 54400;
      break;
    }
    default: {
      price = 0;
      break;
    }
  }

  // if yearly add 10 months - 2 free
  if (price && yearly) {
    price *= 10;
  }

  return price;
};

// get the product id for stripe [todo: use object dip]
export const stripeProductId = (plan: string, yearly?: boolean) => {
  let q = (plan && typeof plan === "string" && plan.toUpperCase()) || "";
  let product = "";

  switch (q) {
    case "L1": {
      if (yearly) {
        product = process.env.STRIPE_L1_PLAN_YEARLY;
      } else {
        product = process.env.STRIPE_L1_PLAN;
      }
      break;
    }
    case "L2": {
      if (yearly) {
        product = process.env.STRIPE_L2_PLAN_YEARLY;
      } else {
        product = process.env.STRIPE_L2_PLAN;
      }
      break;
    }
    case "L3": {
      if (yearly) {
        product = process.env.STRIPE_L3_PLAN_YEARLY;
      } else {
        product = process.env.STRIPE_L3_PLAN;
      }
      break;
    }
    case "L4": {
      if (yearly) {
        product = process.env.STRIPE_L4_PLAN_YEARLY;
      } else {
        product = process.env.STRIPE_L4_PLAN;
      }
      break;
    }
    case "L5": {
      if (yearly) {
        product = process.env.STRIPE_L5_PLAN_YEARLY;
      } else {
        product = process.env.STRIPE_L5_PLAN;
      }
      break;
    }
    // high
    case "H1": {
      if (yearly) {
        product = process.env.STRIPE_H1_PLAN_YEARLY;
      } else {
        product = process.env.STRIPE_H1_PLAN;
      }
      break;
    }
    case "H2": {
      if (yearly) {
        product = process.env.STRIPE_H2_PLAN_YEARLY;
      } else {
        product = process.env.STRIPE_H2_PLAN;
      }
      break;
    }
    case "H3": {
      if (yearly) {
        product = process.env.STRIPE_H3_PLAN_YEARLY;
      } else {
        product = process.env.STRIPE_H3_PLAN;
      }
      break;
    }
    case "H4": {
      if (yearly) {
        product = process.env.STRIPE_H4_PLAN_YEARLY;
      } else {
        product = process.env.STRIPE_H4_PLAN;
      }
      break;
    }
    case "H5": {
      if (yearly) {
        product = process.env.STRIPE_H5_PLAN_YEARLY;
      } else {
        product = process.env.STRIPE_H5_PLAN;
      }
      break;
    }
    default: {
      if (yearly) {
        product = process.env.STRIPE_L1_PLAN_YEARLY;
      } else {
        product = process.env.STRIPE_L1_PLAN;
      }
      break;
    }
  }

  return product;
};

// determine the role of the user
export const roleHandler = (plan: string) => {
  let q = (plan && typeof plan === "string" && plan.toUpperCase()) || "";
  let role = 0;

  switch (q) {
    case "L1": {
      role = 1;
      break;
    }
    case "L2": {
      role = 2;
      break;
    }
    case "L3": {
      role = 3;
      break;
    }
    case "L4": {
      role = 4;
      break;
    }
    case "L5": {
      role = 5;
      break;
    }
    // high
    case "H1": {
      role = 6;
      break;
    }
    case "H2": {
      role = 7;
      break;
    }
    case "H3": {
      role = 8;
      break;
    }
    case "H4": {
      role = 9;
      break;
    }
    case "H5": {
      role = 10;
      break;
    }
    default: {
      role = 0;
      break;
    }
  }

  return role;
};
