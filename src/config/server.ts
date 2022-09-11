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
  const uri = source.endsWith(port) ? source : `${source}:${port}`;
  console.log(`Server ready at ${uri}`);
  console.log(`GraphQl Server ready at ${uri}${graphqlPath}`);
  console.log(`Subscriptions ready at ws://${uri}${graphqlPath}`);
};

const fastifyConfig = {
  trustProxy: true,
  ignoreTrailingSlash: true,
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
