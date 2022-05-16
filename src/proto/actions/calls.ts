import {
  pageMindClient,
  crawlerClient,
  client,
  mavClient,
} from "../website-client";

// perform scan to gRPC -> pagemind for website issues
export const scanAsync = (website = {}) => {
  return new Promise((resolve, reject) => {
    client.scan(website, (error, res) => {
      if (!error) {
        resolve(res);
      } else {
        reject(error);
      }
    });
  });
};

export const scan = (website = {}) => {
  return new Promise((resolve, reject) => {
    pageMindClient.scan(website, (error, res) => {
      if (!error) {
        resolve(res);
      } else {
        reject(error);
      }
    });
  });
};

// start scan job from crawler and gather links as found
export const crawlerScan = (website = {}) => {
  return new Promise((resolve, reject) => {
    crawlerClient.scan(website, (error, res) => {
      if (!error) {
        resolve(res);
      } else {
        reject(error);
      }
    });
  });
};

// start scan job from crawler and wait for all links to be found
export const crawlerCrawl = (website = {}) => {
  return new Promise((resolve, reject) => {
    crawlerClient.crawl(website, (error, res) => {
      if (!error) {
        resolve(res);
      } else {
        reject(error);
      }
    });
  });
};

// store script into s3 | local
export const setScripts = (website = {}) => {
  return new Promise((resolve, reject) => {
    pageMindClient.setScripts(website, (error, res) => {
      if (!error) {
        resolve(res);
      } else {
        reject(error);
      }
    });
  });
};

// detect image type
const parseImg = (website = {}) => {
  return new Promise((resolve, reject) => {
    mavClient.parseImg(website, (error, res) => {
      if (!error) {
        resolve(res);
      } else {
        reject(error);
      }
    });
  });
};

export const controller = {
  scan,
  crawlerScan,
  crawlerCrawl,
  scanAsync,
  setScripts,
  parseImg,
};
