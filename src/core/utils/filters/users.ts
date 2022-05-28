import { User } from "@app/schema";
import { getDay, subHours } from "date-fns";

interface Params {
  id?: any;
  email?: string;
  emailConfirmCode?: string;
}

export function userParams({ id, email, emailConfirmCode }: Params) {
  let searchProps = {};

  if (typeof email !== "undefined") {
    searchProps = { email };
  }

  if (typeof id !== "undefined") {
    searchProps = { ...searchProps, id: Number(id) };
  }

  if (typeof emailConfirmCode !== "undefined") {
    searchProps = { ...searchProps, emailConfirmCode };
  }

  return searchProps;
}

// determine if user can send email based on filter days @returns boolean
export const getEmailAllowedForDay = (user: User) => {
  const { alertEnabled, emailFilteredDates } = user;
  const emailAvailable = alertEnabled && Array.isArray(emailFilteredDates);

  // TODO: LOOK AT DAY DETECTION FOR USER EMAILS
  return emailAvailable
    ? !emailFilteredDates.includes(getDay(subHours(new Date(), 12)))
    : true;
};
