import { Website } from "../../../../types/schema";
import { WEBSITE_NOT_FOUND, SUCCESS } from "../../../../core/strings";
import { actionsCollection } from "../../../../database";
import { getWebsite } from "../find";
import { cipher } from "../../../../core/utils";
import { DEV } from "../../../../config";
import { filterRunnerDuplicates } from "../../../utils/filters/runners";

// update a website by properties from form input on adding
export const updateWebsite = async ({
  userId,
  url,
  pageHeaders,
  pageInsights,
  mobile,
  standard,
  ua,
  actions,
  robots = true,
  tld,
  subdomains,
  ignore,
  rules,
  runners,
  proxy,
  sitemap,
  monitoringEnabled,
  actionsEnabled,
}: Partial<Website> & { actions?: Record<string, unknown>[] }) => {
  const [website, collection] = await getWebsite({ userId, url });

  if (!website) {
    throw new Error(WEBSITE_NOT_FOUND);
  }

  // params prior - we mutate this on update
  const pageParams = {
    actionsEnabled: website.actionsEnabled, // todo: remove actionsEnabled or set property to toggle
    robots,
    pageHeaders: website.pageHeaders,
    pageInsights: website.pageInsights,
    mobile: website.mobile,
    standard: website.standard,
    ua: website.ua ? website.ua : undefined,
    subdomains: !!website.subdomains,
    tld: !!website.tld,
    ignore: website.ignore,
    rules: website.rules,
    runners: website.runners,
    proxy: website.proxy,
    sitemap: !!website.sitemap,
    monitoringEnabled: website.monitoringEnabled,
  };

  // if page headers are sent add them
  if (typeof pageHeaders !== "undefined" && Array.isArray(pageHeaders)) {
    const pageHeaderSrc =
      pageHeaders?.length === 1 && !pageHeaders[0].key ? null : pageHeaders;

    pageParams.pageHeaders = pageHeaderSrc;
  }

  // if lighthouse is enabled
  if (typeof pageInsights !== "undefined") {
    pageParams.pageInsights = !!pageInsights;
  }

  // if mobile viewport is enabled
  if (typeof mobile !== "undefined") {
    pageParams.mobile = !!mobile;
  }

  // if standard is set
  if (typeof standard !== "undefined") {
    pageParams.standard = standard;
  }

  // if user agent is defined
  if (typeof ua !== "undefined") {
    pageParams.ua = ua;
  }

  // if user tld is defined
  if (typeof tld !== "undefined") {
    pageParams.tld = tld;
  }

  // if user subdomains is defined
  if (typeof subdomains !== "undefined") {
    pageParams.subdomains = subdomains;
  }
  // if user subdomains is defined
  if (typeof sitemap !== "undefined") {
    pageParams.sitemap = sitemap;
  }
  // if user subdomains is defined
  if (typeof monitoringEnabled !== "undefined") {
    pageParams.monitoringEnabled = monitoringEnabled;
  }
  if (typeof actionsEnabled !== "undefined") {
    pageParams.actionsEnabled = actionsEnabled;
  }
  // if proxy is defined
  if (
    (typeof proxy !== "undefined" && !proxy) ||
    (proxy &&
      typeof proxy === "string" &&
      (proxy.startsWith("http") ||
        proxy.startsWith("https") ||
        proxy.startsWith("socks5")))
  ) {
    if (
      DEV ||
      !proxy ||
      (!DEV &&
        (!proxy.startsWith("http://localhost") ||
          !proxy.startsWith("https://localhost")))
    ) {
      pageParams.proxy = !proxy ? "" : cipher(proxy);
    }
  }

  const accessRules = [];

  // rules limit
  if (rules && Array.isArray(rules)) {
    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];

      // validate rule storing
      if (rule && typeof rule === "string" && rule.length < 200) {
        accessRules.push(rule);
      }
      // limit 250 items
      if (i > 250) {
        break;
      }
    }

    pageParams.rules = accessRules;
  }

  const ignoreRules = [];

  // ignore limit
  if (ignore && Array.isArray(ignore)) {
    for (let i = 0; i < ignore.length; i++) {
      const rule = ignore[i];
      // validate rule storing
      if (rule && typeof rule === "string" && rule.length < 200) {
        ignoreRules.push(rule);
      }
      // limit 250 items
      if (i > 250) {
        break;
      }
    }
    pageParams.ignore = ignoreRules;
  }

  const testRunners = [];

  // runners
  if (runners && Array.isArray(runners)) {
    const runnerItems = filterRunnerDuplicates(runners);
    for (let i = 0; i < runnerItems.length; i++) {
      const runner = runnerItems[i];
      if (
        typeof runner === "string" &&
        (runner === "axe" || runner === "htmlcs")
      ) {
        testRunners.push(runner);
      }
      if (i > 3) {
        break;
      }
    }
    pageParams.runners = testRunners;
  }

  await collection.updateOne({ url, userId }, { $set: pageParams });

  // store into actions collection TODO: validate actions
  if (actions && Array.isArray(actions) && actions.length) {
    const domain = website.domain;

    for (let i = 0; i < actions.length; i++) {
      // prevent large actions from running
      if (i > 1000) {
        break;
      }
      const action = actions[i];
      const update = {
        $set: {
          ...action,
          userId,
          domain,
        },
      };
      const path =
        action.path && action.path[0] === "/" ? action.path : `/${action.path}`;

      await actionsCollection.updateOne(
        {
          userId,
          domain,
          path,
        },
        update,
        { upsert: true }
      );
    }
  }

  return {
    website: { ...website, ...pageParams, actions },
    code: 200,
    success: true,
    message: SUCCESS,
  };
};
