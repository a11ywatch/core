import type Stripe from "stripe";

export type Analytic = {
  __typename?: "Analytic";
  id?: string;
  pageUrl?: string;
  errorCount?: number;
  warningCount?: number;
  noticeCount?: number;
  userId?: number;
  domain?: string;
  accessScore?: number;
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
  user?: User;
  issues?: Issue[];
  pages?: Pages[];
  userId?: number;
  domain?: string;
  pageLoadTime?: PageLoadTimeMeta;
  issuesInfo?: IssueMeta;
  pageInsights?: boolean;
  insight?: PageInsights;
};

export type HistoryIssuesArgs = {
  filter?: string;
};

// data returned from runner pagemind
export type PageIssue = {
  documentTitle?: string;
  issues?: Issue[];
  url?: string;
  domain?: string;
  pageUrl?: string;
};

// todo: Refactor recursive gql type
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
  issue?: Issue;
  issues?: Issue[];
  url?: string;
  domain?: string;
  pageUrl?: string;
};

export type IssueIssuesArgs = {
  filter?: string;
};

// meta data for web page issues
export type IssueMeta = {
  __typename?: "IssueMeta";
  issuesFixedByCdn?: number;
  possibleIssuesFixedByCdn?: number;
  totalIssues?: number;
  skipContentIncluded?: boolean;
  errorCount?: number;
  warningCount?: number;
  noticeCount?: number;
  accessScore?: number; // todo: rename
  issueMeta?: { skipContentIncluded: false };
};

export type Mutation = {
  __typename?: "Mutation";
  register?: User;
  login?: User;
  logout?: BasicMutationResponse;
  updateUser?: UpdateUserMutationResponse;
  toggleAlert?: UpdateUserMutationResponse;
  updateWebsite?: UpdateWebSiteMutationResponse;
  crawlWebsite?: UpdateWebSiteMutationResponse;
  scanWebsite?: UpdateWebSiteMutationResponse;
  forgotPassword?: User;
  confirmEmail?: UpdateUserMutationResponse;
  resetPassword?: User;
  addWebsite?: UpdateWebSiteMutationResponse;
  filterEmailDates?: User;
  removeWebsite?: UpdateWebSiteMutationResponse;
  addPaymentSubscription?: UpdateUserMutationResponse;
  cancelSubscription?: UpdateUserMutationResponse;
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
  customHeaders?: CreatePageHeaders[];
  pageInsights?: boolean;
};

export type MutationUpdateScriptArgs = {
  url?: string;
  scriptMeta?: ScriptMetaInput;
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
  emailFilteredDates?: number[];
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
  websites?: Website[];
  website?: Website;
  pages?: Pages[];
  issues?: Issue[];
  history?: History[];
  analytics?: Analytic[];
  issue?: Issue;
  user?: User;
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
  lastScanDate?: number | Date;
  totalUptime?: number;
  usageLimit?: number;
  creditedUptime?: number;
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
  user?: User;
  domain?: string;
  userId?: number;
  pageLoadTime?: PageLoadTimeMeta;
  issues?: Issue[];
  issuesInfo?: IssueMeta;
  pageInsights?: boolean;
  insight?: PageInsights;
};

export type SubDomainIssuesArgs = {
  filter?: string;
};

export type Subscription = {
  __typename?: "Subscription";
  websiteAdded?: Website;
  issueAdded?: Issue;
  emailVerified?: User;
  websiteRemoved?: Website;
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

export type UpdateUserMutationResponse = MutationResponse & {
  __typename?: "UpdateUserMutationResponse";
  code: string;
  success: boolean;
  message: string;
  user?: User;
  alertEnabled?: boolean;
  profileVisible?: boolean;
};

export type UpdateWebSiteMutationResponse = MutationResponse & {
  __typename?: "UpdateWebSiteMutationResponse";
  code: string;
  success: boolean;
  message: string;
  website?: Website;
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
  emailFilteredDates?: number[];
  websites?: Website[];
  profileVisible?: boolean;
  history?: History[];
  scanInfo?: ScanInformation;
  analytics?: Analytic[];
  paymentSubscription?: Stripe.subscriptions.ISubscription;
  websiteLimit?: number;
  lastLoginDate?: string;
  downAlerts?: Website[];
  emailExpDate?: string;
  resetCode?: string;
  stripeID?: string;
  pageSpeedApiKey?: string;
  usageAnchorDate?: number | Date; // the date to track the monthly usage for a user
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
  user?: User;
  userId?: number;
  domain?: string;
  pageLoadTime?: PageLoadTimeMeta;
  issuesInfo?: IssueMeta;
  pages?: Pages[];
  lastScanDate?: number | Date;
  documentTitle?: string;
  cdn?: string;
  pageHeaders?: PageHeaders[];
  online?: boolean;
  timestamp?: string;
  pageInsights?: boolean;
  insight?: PageInsights;
  mobile?: boolean;
  standard?: string;
  ua?: string;
  actionsEnabled?: boolean;
  subdomains?: boolean;
  tld?: boolean;
  monitoringEnabled?: boolean;
  robots?: boolean;
  proxy?: string; // proxy for network request
  sitemap?: boolean; // use a sitemap to crawl the page
  verified?: boolean; // dns verified by user
  ignore?: string[]; // ignore list of rules
  rules?: string[]; // list of rules to comply
  runners?: string[]; // list of runners to use htmlcs, and axe
};

export type WebsiteIssuesArgs = {
  filter?: string;
};

// response from pagemind gRPC request to gather website insight
export type PageMindScanResponse = {
  webPage?: Website;
  issues?: PageIssue;
  userId?: number;
  usage?: number;
};
