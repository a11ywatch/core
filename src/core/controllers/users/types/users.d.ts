import type { User } from "../../types/types";

export interface AuthParams {
  userId?: number;
  googleId?: string;
  githubId?: number;
  password?: string;
  email?: string;
  newPassword?: string;
  resetCode?: string;
}

export interface Params extends AuthParams {
  userId?: number;
  id?: number;
  emailConfirmCode?: string;
  email?: string;
  keyid?: number;
  stripeToken?: string;
  role?: number;
  alertEnabled?: boolean;
  code?: string;
  domain?: string;
  user?: User; // allow passing entire user
  collection?: any; // the user collection to re-use
  profileVisible?: boolean; // when profiles exist to show stats
  pageSpeedApiKey?: string; // personal page speed key
  audience?: number; // old role detection from jwt
}

export interface AlertParams extends AuthParams {
  emailFilteredDates?: string[]; // dates to allow emails
  morning?: boolean; // was the filter in the morning
  id?: number; // user id
}

export interface PaymentsParams extends AuthParams {
  userId?: number;
  id?: number;
  keyid?: number; // user id
  user?: User; // allow passing entire user
  yearly?: boolean; // yearly sub
  stripeToken?: string; // stripe token for user card
}

export interface UserControllerMethodsType {
  createUser(params: Params, chain?: boolean): Promise<User>;
  getUser(params: Params): Promise<[User, any]>;
  updateApiUsage(params: Params): Promise<any>;
  verifyUser(params: AuthParams): Promise<any>;
  confirmEmail(params: Params): Promise<any>;
  addPaymentSubscription(params: PaymentsParams): Promise<any>;
  cancelSubscription(params: Params): Promise<any>;
  updateUser(params: Params, chain?: boolean): Promise<any>;
  forgotPassword(params: Params, chain?: boolean): Promise<any>;
  toggleAlert(params: Params, chain?: boolean): Partial<User>; // async background db updates
  resetPassword(params: Params, chain?: boolean): Promise<any>;
  updateScanAttempt(params: Params): Promise<any>;
  validateEmail(params: Params, chain?: boolean): Promise<any>;
  unsubscribeEmails(params: Params): Promise<any>;
  sendWebsiteOffline(params: Params): Promise<any>;
  setPageSpeedKey(params: Params): Promise<any>;
  updateFilterEmailDates(params: AlertParams): Promise<any>;
}

export interface UserControllerType {
  (user?: any): UserControllerMethodsType;
}
