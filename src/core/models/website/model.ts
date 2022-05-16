const WebsiteModel = {
  userId: undefined,
  url: "",
  domain: "",
  adaScore: undefined,
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
    warningCount: 0,
    errorCount: 0,
    noticeCount: 0,
    adaScore: 0,
    adaScoreAverage: 0,
    issuesFixedByCdn: 0,
    possibleIssuesFixedByCdn: 0,
  },
  lastScanDate: "",
  online: null,
  ua: "", // user agent to use when running
  mobile: false, // mobile first view port
  standard: "WCAG2AA", // standard for testing WCAG
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
