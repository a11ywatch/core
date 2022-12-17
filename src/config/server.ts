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

// init server startup
const logServerInit = (port, { graphqlPath = "/graphql" }) => {
  // remove http/https:// from string
  const _removeHttp = (url: string): string => {
    const https = "https://";
    if (url.startsWith(https)) {
      return url.slice(https.length);
    }
    const http = "http://";
    if (url.startsWith(http)) {
      return url.slice(http.length);
    }
    return url;
  };
  const uri = source.endsWith(port) ? source : `${source}:${port}`;
  console.log(
    `Server ready at ${uri}\nGraphQL server ready at ${uri}${graphqlPath}\nSubscriptions ready at ws://${_removeHttp(
      uri
    )}${graphqlPath}`
  );
};

const fastifyConfig = {
  trustProxy: true,
  ignoreTrailingSlash: true,
  http2: process.env.ENABLE_HTTP2 === "true",
  ...(process.env.ENABLE_SSL === "true" &&
    PRIVATE_KEY &&
    PUBLIC_KEY && {
      https: {
        allowHTTP1: true,
        key: PRIVATE_KEY,
        cert: PUBLIC_KEY,
      },
    }),
};

export { corsOptions, logServerInit, fastifyConfig, cronTimer };
