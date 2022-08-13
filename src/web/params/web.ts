import { Request } from "express";
import { paramParser } from "./extracter";

// extract params for website configuration
export const getWebParams = (req: Request) => {
  const url = paramParser(req, "url");
  const customHeaders = paramParser(req, "customHeaders");
  const mobile = paramParser(req, "mobile");
  const pageInsights = paramParser(req, "pageInsights");
  const ua = paramParser(req, "ua");
  const standard = paramParser(req, "standard");
  const actions = paramParser(req, "actions");
  const robots = paramParser(req, "robots");
  const subdomains = paramParser(req, "subdomains");
  const tld = paramParser(req, "tld");

  return {
    url,
    customHeaders,
    mobile,
    pageInsights,
    ua,
    standard,
    actions,
    robots,
    subdomains,
    tld,
  };
};
