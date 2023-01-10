import { getUserFromApi, getUserFromToken } from "../../core/utils";
import { scanWebsite, crawlPage } from "../../core/actions";
import { paramParser, validateUID } from "../params/extracter";
import { GENERAL_ERROR, WEBSITE_URL_ERROR } from "../../core/strings";
import { responseModel } from "../../core/models";
import { StatusCode } from "../messages/message";
import { frontendClientOrigin } from "../../core/utils/is-client";
import type { FastifyContext } from "apollo-server-fastify";
import { SUPER_MODE } from "../../config/config";

/*
 * SCAN -> PAGEMIND: Single page [does not store values to cdn]
 **/
export const scanSimple = async (
  req: FastifyContext["request"],
  res: FastifyContext["reply"]
) => {
  const baseUrl = paramParser(req, "websiteUrl") || paramParser(req, "url");
  const url = baseUrl ? decodeURIComponent(baseUrl) : "";

  if (!url) {
    res.status(400);
    res.send(
      responseModel({
        code: StatusCode.BadRequest,
        data: null,
        message: WEBSITE_URL_ERROR,
      })
    );
    return;
  }

  const isClient =
    frontendClientOrigin(req.headers["origin"]) ||
    frontendClientOrigin(req.headers["host"]) ||
    frontendClientOrigin(req.headers["referer"]);

  const user = getUserFromToken(
    req.headers["authorization"] || req?.cookies?.jwt
  );

  // only allow client authed requests
  if (!isClient) {
    // validate user creds
    if (!user) {
      res.status(403);
      res.send(
        responseModel({
          code: StatusCode.Error,
          data: null,
          message: GENERAL_ERROR,
        })
      );
      return;
    }
  }

  const pageInsights = paramParser(req, "pageInsights");

  const resData = await scanWebsite({
    url,
    noStore: true, // only store if domain exists for user todo -
    pageInsights,
    userId: user?.payload?.keyid,
  });

  res.send(resData);
};

/*
 * SCAN -> PAGEMIND: Single page authenticated route
 **/
export const scanAuthenticated = async (
  req: FastifyContext["request"],
  res: FastifyContext["reply"]
) => {
  const baseUrl = paramParser(req, "websiteUrl") || paramParser(req, "url");
  const html = paramParser(req, "html");
  const url = baseUrl ? decodeURIComponent(baseUrl) : "";

  if (!url && !html) {
    res.status(400);
    res.send(
      responseModel({
        code: StatusCode.BadRequest,
        data: null,
        message: WEBSITE_URL_ERROR,
      })
    );
    return;
  }

  // returns truthy if can continue
  const userNext = await getUserFromApi(
    req?.headers?.authorization || req?.cookies?.jwt,
    req,
    res
  );
  const userId = userNext?.id;

  let resData = {};

  // only allow valid users to crawl
  if (validateUID(userId) || SUPER_MODE) {
    const pageInsights = paramParser(req, "pageInsights");
    const standard = paramParser(req, "standard");

    // todo: validation handling before sending to rpc services into util
    const ignore = paramParser(req, "ignore");
    const rules = paramParser(req, "rules");
    const runners = paramParser(req, "runners");

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
    }

    const testRunners = [];

    // runners
    if (runners && Array.isArray(runners)) {
      for (let i = 0; i < runners.length; i++) {
        const runner = runners[i];
        // validate rule storing
        if (
          runner &&
          typeof runner === "string" &&
          ["htmlcs", "axe"].includes(runner)
        ) {
          testRunners.push(runner);
        }
        // limit 250 items
        if (i > 3) {
          break;
        }
      }
    }

    resData = await crawlPage(
      {
        url,
        userId,
        pageInsights,
        sendSub: false,
        standard,
        html,
        ignore: ignoreRules,
        rules: accessRules,
        runners: testRunners,
      },
      false,
      true
    );
  }

  res.send(resData);
};
