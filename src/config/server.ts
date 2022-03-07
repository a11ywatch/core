import { log } from "@a11ywatch/log";
import { config } from "./config";

const { CLIENT_URL, WATCHER_CLIENT_URL, ROOT_URL, DEV } = config;

const apiUrls = String(CLIENT_URL).split(",");

export const whitelist: string[] = [
  ...apiUrls,
  ...apiUrls.map((url) => url.replace("http", "https")),
  WATCHER_CLIENT_URL,
  "a11ywatch.com",
  "www.a11ywatch.com",
  "https://a11ywatch.com",
  "https://www.a11ywatch.com",
  "http://a11ywatch.com",
  "http://www.a11ywatch.com",
  "a11ywatch.vercel.app",
].filter(Boolean);

const corsOptions: { origin: string[] | boolean; credentials: boolean } = {
  origin: whitelist,
  credentials: true,
};

// ALLOW LOCAL NETWORK
if (apiUrls.some((a) => a.includes("localhost"))) {
  corsOptions.origin = true;
}

export { corsOptions };

export const BYPASS_AUTH = [
  "IntrospectionQuery",
  "Register",
  "Login",
  "Logout",
  "ForgotPassword",
  "Testout",
  "ResetPassword",
  "ScanWebsite",
  "CrawlWebsite",
  "Payments",
  "getScript",
  "getWebsites",
  "getIssue",
  "getUser",
];

export const cronTimer = DEV ? "0 1 * * *" : "0 16 * * *";

const source = DEV ? "localhost" : ROOT_URL;

export const logServerInit = (port, { graphqlPath, subscriptionsPath }) => {
  log(
    `Server ready at ${source}:${port}${graphqlPath}\nSubscriptions ready at ws://${source}:${port}${subscriptionsPath}`
  );
};
