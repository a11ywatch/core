import { pageMindClient, client } from "../website-client";

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

export const controller = {
  scan,
  listWebsites,
  listIssue,
  insertIssue,
};
