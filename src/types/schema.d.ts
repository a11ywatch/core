import type Stripe from "stripe";

export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = {
  [K in keyof T]: T[K];
};
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]?: Maybe<T[SubKey]>;
};
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & {
  [SubKey in K]: Maybe<T[SubKey]>;
};
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type Analytic = {
  __typename?: "Analytic";
  id?: string;
  pageUrl?: string;
  errorCount?: number;
  warningCount?: number;
  noticeCount?: number;
  userId?: number;
  domain?: string;
  adaScore?: Maybe<Scalars["Float"]>;
};

export type BasicMutationResponse = MutationResponse & {
  __typename?: "BasicMutationResponse";
  code: string;
  success: boolean;
  message: string;
};

export type CreatePageHeaders = {
  key: string;
  value: string;
};

export type Feature = {
  __typename?: "Feature";
  id?: string;
  feature?: string;
  enabled?: boolean;
  user?: Maybe<Array<Maybe<User>>>;
  accountType?: string;
};

export type History = {
  __typename?: "History";
  id?: string;
  url?: string;
  user?: Maybe<User>;
  issues?: Maybe<Array<Maybe<Issue>>>;
  pages?: Maybe<Array<Maybe<Pages>>>;
  userId?: number;
  domain?: string;
  cdnConnected?: boolean;
  pageLoadTime?: Maybe<PageLoadTimeMeta>;
  issuesInfo?: Maybe<IssueMeta>;
  pageInsights?: boolean;
  insight?: Maybe<PageInsights>;
};

export type HistoryIssuesArgs = {
  filter?: string;
};

export type Issue = {
  __typename?: "Issue";
  documentTitle?: string;
  code?: string;
  type?: string;
  typeCode?: number;
  message?: string;
  context?: string;
  selector?: string;
  runner?: string;
  issue?: Maybe<Issue>;
  issues?: Maybe<Array<Maybe<Issue>>>;
  url?: string;
  domain?: string;
  pageUrl?: string;
};

export type IssueIssuesArgs = {
  filter?: string;
};

export type IssueMeta = {
  __typename?: "IssueMeta";
  issuesFixedByCdn?: number;
  possibleIssuesFixedByCdn?: number;
  totalIssues?: number;
  cdnConnected?: boolean;
  skipContentIncluded?: boolean;
  errorCount?: number;
  warningCount?: number;
};

export type Mutation = {
  __typename?: "Mutation";
  register?: Maybe<User>;
  login?: Maybe<User>;
  logout?: Maybe<BasicMutationResponse>;
  updateUser?: Maybe<UpdateUserMutationResponse>;
  toggleAlert?: Maybe<UpdateUserMutationResponse>;
  updateWebsite?: Maybe<UpdateWebSiteMutationResponse>;
  updateScript?: Maybe<UpdateScriptMutationResponse>;
  crawlWebsite?: Maybe<UpdateWebSiteMutationResponse>;
  scanWebsite?: Maybe<UpdateWebSiteMutationResponse>;
  forgotPassword?: Maybe<User>;
  confirmEmail?: Maybe<UpdateUserMutationResponse>;
  resetPassword?: Maybe<User>;
  addWebsite?: Maybe<UpdateWebSiteMutationResponse>;
  filterEmailDates?: Maybe<User>;
  removeWebsite?: Maybe<UpdateWebSiteMutationResponse>;
  addPaymentSubscription?: Maybe<UpdateUserMutationResponse>;
  cancelSubscription?: Maybe<UpdateUserMutationResponse>;
};

export type MutationRegisterArgs = {
  email: string;
  password?: string;
  googleId?: string;
  githubId?: number;
};

export type MutationLoginArgs = {
  email: string;
  password?: string;
  googleId?: string;
  githubId?: number;
};

export type MutationUpdateUserArgs = {
  password?: string;
  newPassword?: string;
};

export type MutationToggleAlertArgs = {
  alertEnabled?: boolean;
};

export type MutationToggleProfileArgs = {
  toggleAlert?: boolean;
};

export type MutationUpdateWebsiteArgs = {
  url?: string;
  customHeaders?: Maybe<Array<Maybe<CreatePageHeaders>>>;
  pageInsights?: boolean;
};

export type MutationUpdateScriptArgs = {
  url?: string;
  scriptMeta?: Maybe<ScriptMetaInput>;
  editScript?: boolean;
  newScript?: string;
};

export type MutationCrawlWebsiteArgs = {
  url?: string;
};

export type MutationScanWebsiteArgs = {
  url?: string;
};

export type MutationForgotPasswordArgs = {
  email?: string;
};

export type MutationConfirmEmailArgs = {
  email?: string;
};

export type MutationResetPasswordArgs = {
  email?: string;
  resetCode?: string;
  jwt?: string;
};

export type MutationAddWebsiteArgs = {
  url: string;
  customHeaders?: CreatePageHeaders[];
  pageInsights?: boolean;
};

export type MutationFilterEmailDatesArgs = {
  emailFilteredDates?: Maybe<Array<number>>;
};

export type MutationRemoveWebsiteArgs = {
  url?: string;
  deleteMany?: boolean;
};

export type MutationAddPaymentSubscriptionArgs = {
  email?: string;
  stripeToken?: string;
  yearly?: boolean;
};

export type MutationCancelSubscriptionArgs = {
  email?: string;
};

export type MutationResponse = {
  code: string;
  success: boolean;
  message: string;
};

export type PageHeaders = {
  __typename?: "PageHeaders";
  key?: string;
  value?: string;
};

export type PageInsights = {
  __typename?: "PageInsights";
  json?: string; // rest api receivves json
};

export type PageLoadTimeMeta = {
  __typename?: "PageLoadTimeMeta";
  duration?: number;
  durationFormated?: string;
  color?: string;
};

export type PaymentPlan = {
  __typename?: "PaymentPlan";
  id?: string;
  object?: string;
  active?: boolean;
  amount?: number;
  amount_decimal?: string;
  nickname?: string;
  currency?: string;
  interval?: string;
  product?: string;
};

export type PaymentSubScription = {
  __typename?: "PaymentSubScription";
  id?: string;
  object?: string;
  application_fee_percent?: number;
  billing_cycle_anchor?: number;
  cancel_at_period_end?: boolean;
  customer?: string;
  ended_at?: string;
  canceled_at?: string;
  status?: string;
  start_date?: string;
  plan?: Maybe<PaymentPlan>;
  days_until_due?: string;
  current_period_end?: string;
  current_period_start?: string;
  created?: string;
  collection_method?: string;
};

export type Query = {
  __typename?: "Query";
  websites?: Maybe<Array<Maybe<Website>>>;
  website?: Maybe<Website>;
  pages?: Maybe<Array<Maybe<Pages>>>;
  issues?: Maybe<Array<Maybe<Issue>>>;
  history?: Maybe<Array<Maybe<History>>>;
  analytics?: Maybe<Array<Maybe<Analytic>>>;
  scripts?: Maybe<Array<Maybe<Script>>>;
  script?: Maybe<Script>;
  issue?: Maybe<Issue>;
  user?: Maybe<User>;
};

export type QueryWebsitesArgs = {
  filter?: string;
};

export type QueryWebsiteArgs = {
  url?: string;
};

export type QuerySubDomainsArgs = {
  filter?: string;
};

export type QueryIssuesArgs = {
  filter?: string;
};

export type QueryHistoryArgs = {
  filter?: string;
};

export type QueryAnalyticsArgs = {
  filter?: string;
};

export type QueryScriptsArgs = {
  filter?: string;
};

export type QueryScriptArgs = {
  filter?: string;
  url?: string;
};

export type QueryIssueArgs = {
  url?: string;
};

export type ScanInformation = {
  __typename?: "ScanInformation";
  lastScanDate?: Maybe<Scalars["Date"]>;
  totalUptime?: number;
  usageLimit?: number;
};

export type Script = {
  __typename?: "Script";
  id?: string;
  pageUrl?: string;
  domain?: string;
  script?: string;
  cdnUrl?: string;
  cdnUrlMinified?: string;
  cdnConnected?: boolean;
  issueMeta?: Maybe<IssueMeta>;
  scriptMeta?: Maybe<ScriptMeta>;
};

export type ScriptMeta = {
  __typename?: "ScriptMeta";
  skipContentEnabled?: boolean;
  translateEnabled?: boolean;
};

export type ScriptMetaInput = {
  skipContentEnabled?: boolean;
  translateEnabled?: boolean;
};

export type Pages = {
  __typename?: "Pages";
  id?: string;
  url?: string;
  user?: Maybe<User>;
  domain?: string;
  userId?: number;
  cdnConnected?: boolean;
  pageLoadTime?: Maybe<PageLoadTimeMeta>;
  issues?: Maybe<Array<Maybe<Issue>>>;
  issuesInfo?: Maybe<IssueMeta>;
  pageInsights?: boolean;
  insight?: Maybe<PageInsights>;
};

export type SubDomainIssuesArgs = {
  filter?: string;
};

export type Subscription = {
  __typename?: "Subscription";
  websiteAdded?: Maybe<Website>;
  issueAdded?: Maybe<Issue>;
  emailVerified?: Maybe<User>;
  websiteRemoved?: Maybe<Website>;
};

export type SubscriptionWebsiteAddedArgs = {
  userId?: number;
};

export type SubscriptionIssueAddedArgs = {
  userId?: number;
};

export type SubscriptionSubDomainAddedArgs = {
  userId?: number;
};

export type SubscriptionEmailVerifiedArgs = {
  userId?: number;
};

export type UpdateScriptMutationResponse = MutationResponse & {
  __typename?: "UpdateScriptMutationResponse";
  code: string;
  success: boolean;
  message: string;
  script?: Maybe<Script>;
};

export type UpdateUserMutationResponse = MutationResponse & {
  __typename?: "UpdateUserMutationResponse";
  code: string;
  success: boolean;
  message: string;
  user?: Maybe<User>;
  alertEnabled?: boolean;
  profileVisible?: boolean;
};

export type UpdateWebSiteMutationResponse = MutationResponse & {
  __typename?: "UpdateWebSiteMutationResponse";
  code: string;
  success: boolean;
  message: string;
  website?: Maybe<Website>;
};

export type User = {
  __typename?: "User";
  id?: number;
  email?: string;
  password?: string;
  jwt?: string;
  salt?: string;
  loggedIn?: boolean;
  passwordRequired?: boolean;
  alertEnabled?: boolean;
  lastAlertSent?: number;
  lastAlertDateStamp?: number;
  googleId?: string;
  githubId?: number;
  role?: number;
  activeSubscription?: boolean;
  emailConfirmed?: boolean;
  emailFilteredDates?: Maybe<Array<number>>;
  websites?: Maybe<Array<Maybe<Website>>>;
  profileVisible?: boolean;
  history?: Maybe<Array<Maybe<History>>>;
  scanInfo?: Maybe<ScanInformation>;
  analytics?: Maybe<Array<Maybe<Analytic>>>;
  scripts?: Maybe<Array<Maybe<Script>>>;
  script?: Maybe<Script>;
  paymentSubscription?: Maybe<Stripe.subscriptions.ISubscription>;
  websiteLimit?: number;
  downAlerts?: Maybe<Array<Maybe<Website>>>;
  emailExpDate?: string;
  resetCode?: string;
  stripeID?: string;
  pageSpeedApiKey?: string;
};

export type UserAnalyticsArgs = {
  filter?: string;
};

export type UserScriptsArgs = {
  filter?: string;
};

export type UserScriptArgs = {
  filter?: string;
  url?: string;
};

export type Website = {
  __typename?: "Website";
  id?: string;
  url?: string;
  user?: Maybe<User>;
  userId?: number;
  domain?: string;
  cdnConnected?: boolean;
  pageLoadTime?: Maybe<PageLoadTimeMeta>;
  issues?: Maybe<Array<Maybe<Issue>>>;
  issue?: Maybe<Array<Maybe<Issue>>>;
  issuesInfo?: Maybe<IssueMeta>;
  pages?: Maybe<Array<Maybe<Pages>>>;
  script?: Maybe<Script>;
  lastScanDate?: string;
  documentTitle?: string;
  cdn?: string;
  pageHeaders?: Maybe<Array<Maybe<PageHeaders>>>;
  online?: boolean;
  timestamp?: string;
  pageInsights?: boolean;
  insight?: Maybe<PageInsights>;
  mobile?: boolean;
  standard?: string;
  ua?: string;
  subdomains?: boolean;
  tld?: boolean;
  robots?: boolean;
  verified?: boolean; // dns verified by user
};

export type WebsiteIssuesArgs = {
  filter?: string;
};

// response from pagemind gRPC request to gather website insight
export type PageMindScanResponse = {
  webPage?: Website;
  issues?: Issue[];
  script?: Script;
  userId?: number;
  usage?: number;
};
