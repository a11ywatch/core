import fs from "fs";
import { replaceDockerNetwork } from "@a11ywatch/website-source-builder";
import { CookieOptions } from "express";

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
  } catch (e) {
    console.error(e);
  }
}

if (!PUBLIC_KEY) {
  try {
    PUBLIC_KEY = fs.readFileSync("./public.key", "utf8");
  } catch (e) {
    console.error(e);
  }
}

if (!EMAIL_CLIENT_KEY && PRIVATE_KEY) {
  EMAIL_CLIENT_KEY = PRIVATE_KEY;
}

const GRAPHQL_PORT = Number(
  TEST_ENV ? 0 : process.env.PORT || process.env.GRAPHQL_PORT || 0
);

// if ran from the CLI prevent rate-limits and usage limits [TODO]
export const SUPER_MODE = process.env.SUPER_MODE === "true";

const defaultWebPort = process.env.WEB_PORT || 3000;
const defaultWebURL = DEV
  ? `http://localhost:${defaultWebPort}`
  : "https://a11ywatch.com";

export const config = {
  DEV,
  DB_URL: process.env.MONGO_URL || process.env.DB_URL,
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
  SUPER_MODE,
};

let cookieConfigs: CookieOptions = {
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

export const cdnBase =
  process.env.SCRIPTS_CDN_URL_HOST &&
  process.env.SCRIPTS_CDN_URL_HOST.includes("127.0.0.1")
    ? process.env.SCRIPTS_CDN_URL_HOST
    : "http://cdn-server:8090/cdn";

export { cookieConfigs, DEV, TEST_ENV, PRIVATE_KEY, PUBLIC_KEY };
