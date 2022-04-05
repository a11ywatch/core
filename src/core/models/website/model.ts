const WebsiteModel = {
  userId: -1,
  url: "",
  domain: "",
  adaScore: null,
  cdnConnected: false,
  pageInsights: false,
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
  pageHeaders: null,
  online: null,
  ua: "", // user agent to use when running
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
