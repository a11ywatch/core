import { getUserFromToken } from "../../core/utils";
import type { FastifyContext } from "apollo-server-fastify";

// extract query or body params from req
export const paramParser = (req: FastifyContext["request"], value: string) => {
  return (req.query && req.query[value]) || (req.body && req.body[value]);
};

// get the base params for a standard collection retrieval by userId, domain, and url
export const getBaseParams = (req: FastifyContext["request"]) => {
  const usr = getUserFromToken(req.headers.authorization);
  const dman = paramParser(req, "domain");
  const url = paramParser(req, "url") || paramParser(req, "pageUrl");

  const domain = dman ? decodeURIComponent(dman) : undefined;
  const pageUrl = url ? decodeURIComponent(url) : undefined;

  const userId = usr?.payload?.keyid;

  return {
    userId,
    domain,
    pageUrl,
  };
};

// get the base params for a standard collection retrieval by userId, domain, and url, with pagination
export const getBaseParamsList = (req: FastifyContext["request"]) => {
  const { userId, domain, pageUrl } = getBaseParams(req);
  const query = req.query as { offset?: number; limit?: number };

  let offset;

  if (query?.offset) {
    const oset = Number(query?.offset);
    offset = Number.isNaN(oset) ? 0 : oset;
  }

  return {
    userId,
    domain,
    pageUrl,
    offset,
    limit: query.limit ? Math.max(query.limit, 100) : 5,
  };
};

// determine if a userID is valid to use for DB querys and etc.
export const validateUID = (id: string | number) =>
  typeof id === "number" || typeof id === "string";
