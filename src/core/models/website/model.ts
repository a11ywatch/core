const WebsiteModel = {
  userId: undefined,
  url: "",
  domain: "",
  adaScore: null,
  cdnConnected: false,
  pageInsights: false,
  pageHeaders: undefined,
  insight: {
    json: "",
  },
  pageLoadTime: {
    duration: 0,
    durationFormated: "",
    color: "",
  },
  issuesInfo: {
    issuesFixedByCdn: 0,
    possibleIssuesFixedByCdn: 0,
    totalIssues: 0,
  },
  lastScanDate: "",
  online: null,
  ua: "", // user agent to use when running
  mobile: false, // mobile first view port
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
      lastScanDate: new Date().toUTCString(),
    },
    extra
  );
};

export { WebsiteModel, makeWebsite };
