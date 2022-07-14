const WebsiteModel = {
  userId: undefined,
  url: "",
  domain: "",
  cdnConnected: false,
  pageInsights: false,
  pageHeaders: [],
  insight: {
    json: "",
  },
  pageLoadTime: {
    duration: 0,
    durationFormated: "",
    color: "",
  },
  issuesInfo: {
    adaScore: 0,
    warningCount: 0,
    errorCount: 0,
    noticeCount: 0,
    adaScoreAverage: 0,
    issuesFixedByCdn: 0,
    possibleIssuesFixedByCdn: 0,
    totalIssues: 0,
    pageCount: 0,
    issueMeta: {
      skipContentIncluded: false,
    },
  },
  lastScanDate: "",
  online: true,
  ua: "", // user agent to use when running
  mobile: false, // mobile first view port
  standard: "WCAG2AA", // standard for testing WCAG
  actionsEnabled: false,
  robots: true,
  subdomains: false, // allow subdomains to joinscope
  tld: false, // allow tld to join scope
  order: 0, // the sort order
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
