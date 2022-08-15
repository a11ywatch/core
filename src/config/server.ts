import { config, PRIVATE_KEY, PUBLIC_KEY } from "./config";

const { CLIENT_URL, ROOT_URL, DEV } = config;

const apiUrls = String(CLIENT_URL).split(",");

export const whitelist: string[] = [
  ...apiUrls,
  ...apiUrls.map((url) => url.replace("http", "https")),
].filter(Boolean);

const corsOptions: { origin: string[] | boolean; credentials: boolean } = {
  origin: whitelist,
  credentials: true,
};

// ALLOW LOCAL NETWORK
if (apiUrls.some((a) => a.includes("localhost"))) {
  corsOptions.origin = true;
}

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
];

const cronTimer = DEV ? "0 1 * * *" : "0 16 * * *";

const source = DEV ? "localhost" : ROOT_URL;

const logServerInit = (port, { graphqlPath = "/graphql" }) => {
  console.log(`Server ready at ${source}:${port}`);
  console.log(`GraphQl Server ready at ${source}:${port}${graphqlPath}`);
  console.log(`Subscriptions ready at ws://${source}:${port}${graphqlPath}`);
};

const fastifyConfig = {
  trustProxy: true,
  ...(process.env.ENABLE_SSL === "true" &&
    PRIVATE_KEY &&
    PUBLIC_KEY && {
      http2: true,
      https: {
        allowHTTP1: true,
        key: PRIVATE_KEY,
        cert: PUBLIC_KEY,
      },
    }),
};

export { corsOptions, logServerInit, fastifyConfig, cronTimer };
