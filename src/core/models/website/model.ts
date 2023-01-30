const WebsiteModel = {
  userId: undefined,
  url: "",
  domain: "",
  pageInsights: false,
  pageHeaders: [],
  // insight: null, insight from pageSpeed
  pageLoadTime: {
    duration: 0,
    durationFormated: "",
    color: "",
  },
  lastScanDate: "",
  online: true,
  ua: "", // user agent to use when running
  mobile: false, // mobile first view port
  standard: "WCAG2AA", // standard for testing WCAG
  actionsEnabled: false,
  monitoringEnabled: true,
  robots: true,
  subdomains: false, // allow subdomains to joinscope
  tld: false, // allow tld to join scope
  order: 0, // the sort order
  verified: false, // website verified
  verificationCode: "", // code to validate website record
  ignore: [], // ignore list of rules
  rules: [], // list of rules
  runners: [], // runners htmlcs, axe, & a11y
  proxy: "", // proxy for request
};

const makeWebsite = (
  { url, domain, ...extra }: any = { url: "", domain: "" }
): typeof WebsiteModel => {
  return Object.assign(
    {},
    WebsiteModel,
    {
      url,
      domain,
      lastScanDate: new Date().toISOString(),
    },
    extra
  );
};

export { WebsiteModel, makeWebsite };
