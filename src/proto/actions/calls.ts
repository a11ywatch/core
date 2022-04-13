import { pageMindClient, crawlerClient, client } from "../website-client";

export const listWebsites = () => {
  return new Promise((resolve, reject) => {
    client.list({}, (error, res) => {
      if (!error) {
        resolve(res);
      } else {
        reject(error);
      }
    });
  });
};

export const insertIssue = (website = {}) => {
  return new Promise((resolve, reject) => {
    client.insert(website, (error, res) => {
      if (!error) {
        resolve(res);
      } else {
        reject(error);
      }
    });
  });
};

export const listIssue = (website = {}) => {
  return new Promise((resolve, reject) => {
    pageMindClient.gather(website, (error, res) => {
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

// start scan job from crawler to gather pages [TODO: rename method]
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

// start scan job from crawler to gather pages [TODO: rename method]
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

export const controller = {
  scan,
  crawlerScan,
  crawlerCrawl,
  listWebsites,
  listIssue,
  insertIssue,
  setScripts,
};
