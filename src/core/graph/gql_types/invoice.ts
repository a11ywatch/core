import gql from "graphql-tag";

export const invoice = gql`
  """
  A invoice for a plan.
  """
  type Invoice {
    amount_due: Int
    amount_paid: Int
    amount_remaining: Int
    period_end: Int
    period_start: Int
    total: Int
    sub_total: Int
    next_payment_attempt: Int
    paid: Boolean
    billing_reason: String
  }
`;
