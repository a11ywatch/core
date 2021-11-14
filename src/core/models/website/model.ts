// TODO: ADD TYPES
const WebsiteModel = {
  userId: -1,
  id: null,
  url: "",
  domain: "",
  adaScore: null,
  cdnConnected: false,
  html: "",
  htmlIncluded: false,
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
};

export interface Params {
  url: string;
  domain: string;
  userId?: number;
  id?: number;
  [x: string]: any;
}

const makeWebsite = (
  { url, domain, ...extra }: Params = { url: "", domain: "" }
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
