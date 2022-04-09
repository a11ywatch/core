import { credentials } from "@grpc/grpc-js";
import { getProto } from "./website";

let client;

const createClient = async () => {
  const { WebsiteService } = await getProto();
  client = new WebsiteService("localhost:50051", credentials.createInsecure());
};

const listWebsites = () => {
  return new Promise((resolve, reject) => {
    client.list({}, (error, pages) => {
      if (!error) {
        resolve(pages);
      } else {
        reject(error);
      }
    });
  });
};

export { client, createClient, listWebsites };
