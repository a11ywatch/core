import { credentials } from "@grpc/grpc-js";
import { GRPC_HOST } from "@app/config/rpc";
import { Service, getProto } from "./website";

let client: Service["WebsiteService"]["service"];

export const killClient = () => {
  client?.close();
};

const createClient = async () => {
  const { WebsiteService } = await getProto();
  client = new WebsiteService(GRPC_HOST, credentials.createInsecure());
};

const listWebsites = () => {
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

const insertWebsites = (website = {}) => {
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

const controller = {
  listWebsites,
  insertWebsites,
};

export { client, createClient, controller };
