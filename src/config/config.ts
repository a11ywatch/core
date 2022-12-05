import fs from "fs";
import { replaceDockerNetwork } from "@a11ywatch/website-source-builder";
import type { CookieSerializeOptions } from "@fastify/cookie";

const DEV = process.env.NODE_ENV !== "production";
const TEST_ENV = process.env.NODE_ENV === "test";

let PUBLIC_KEY =
  process.env.PUBLIC_KEY &&
  String(process.env.PUBLIC_KEY).replace(/\\n/gm, "\n");
let PRIVATE_KEY =
  process.env.PRIVATE_KEY &&
  String(process.env.PRIVATE_KEY).replace(/\\n/gm, "\n");

// email key
let EMAIL_CLIENT_KEY =
  process.env.EMAIL_CLIENT_KEY &&
  String(process.env.EMAIL_CLIENT_KEY).replace(/\\n/gm, "\n");

if (!PRIVATE_KEY) {
  try {
    PRIVATE_KEY = fs.readFileSync("./private.key", "utf8");
  } catch (_) {}
}

if (!PUBLIC_KEY) {
  try {
    PUBLIC_KEY = fs.readFileSync("./public.key", "utf8");
  } catch (_) {}
}

if (!EMAIL_CLIENT_KEY && PRIVATE_KEY) {
  EMAIL_CLIENT_KEY = PRIVATE_KEY;
}

const GRAPHQL_PORT = Number(
  process.env.PORT || process.env.GRAPHQL_PORT || 3280
);

// default SUPER mode to true
export const SUPER_MODE = process.env.SUPER_MODE === "false" ? false : true;
// default SCRIPTS_ENABLED to false in SUPER mode.
export const SCRIPTS_ENABLED =
  process.env.SCRIPTS_ENABLED === "true" ? true : false;

const defaultWebPort = process.env.WEB_PORT || 3000;
const defaultWebURL = DEV
  ? `http://localhost:${defaultWebPort}`
  : "https://a11ywatch.com";

// prevent storing content to CDN server
export const DISABLE_STORE_SCRIPTS =
  process.env.A11YWATCH_NO_STORE === "true" ? true : false;

export const config = {
  DEV,
  DB_URL: process.env.DB_URL || process.env.MONGO_URL,
  DB_NAME: process.env.DB_NAME || "a11ywatch",
  CLIENT_URL: replaceDockerNetwork(process.env.CLIENT_URL),
  GRAPHQL_PORT,
  ROOT_URL: process.env.ROOT_URL || "http://localhost:3280",
  DOMAIN: process.env.DOMAIN ? process.env.DOMAIN : defaultWebURL,
  // EMAIL
  EMAIL_SERVICE_URL: process.env.EMAIL_SERVICE_URL,
  EMAIL_CLIENT_ID: process.env.EMAIL_CLIENT_ID,
  EMAIL_CLIENT_KEY,
  // STRIPE
  STRIPE_KEY: process.env.STRIPE_KEY,
  STRIPE_BASIC_PLAN: process.env.STRIPE_BASIC_PLAN,
  STRIPE_PREMIUM_PLAN: process.env.STRIPE_PREMIUM_PLAN,
  STRIPE_BASIC_PLAN_YEARLY: process.env.STRIPE_BASIC_PLAN_YEARLY,
  STRIPE_PREMIUM_PLAN_YEARLY: process.env.STRIPE_PREMIUM_PLAN_YEARLY,
  STRIPE_WH_SECRET: process.env.STRIPE_WH_SECRET,
  SUPER_MODE,
};

let cookieConfigs: CookieSerializeOptions = {
  maxAge: 228960000,
  sameSite: "lax",
  httpOnly: true,
  secure: true,
  domain: config.DOMAIN.replace("https://", "."),
};

if (DEV) {
  cookieConfigs = {
    ...cookieConfigs,
    sameSite: false,
    secure: false,
    domain: undefined,
  };
}

export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

export { cookieConfigs, DEV, TEST_ENV, PRIVATE_KEY, PUBLIC_KEY };
