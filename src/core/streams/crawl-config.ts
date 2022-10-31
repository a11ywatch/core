import { SUPER_MODE } from "../../config/config";
import { getWebsite } from "../controllers/websites";

// get the website crawl configuration
export const getCrawlConfig = async ({
  id,
  role,
  url,
  tld,
  subdomains,
  robots = true,
}) => {
  let subdomainsEnabled = subdomains;
  let tldEnabled = tld;

  // get website configuration [todo: remove]
  if (!subdomainsEnabled || !tldEnabled) {
    const [website] = await getWebsite({ userId: id, url });
    if (website) {
      if (!subdomainsEnabled) {
        subdomainsEnabled = website.subdomains;
      }
      if (!tldEnabled) {
        tldEnabled = website.tld;
      }
    }
  }

  // bypass configurations
  if (!SUPER_MODE) {
    subdomainsEnabled = subdomainsEnabled && role;
    tldEnabled = tldEnabled && role;
  }

  return {
    url,
    userId: id,
    subdomains: subdomainsEnabled,
    tld: tldEnabled,
    robots,
  };
};
