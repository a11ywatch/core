import { credentials } from "@grpc/grpc-js";
import {
  GRPC_HOST,
  GRPC_HOST_PAGEMIND,
  GRPC_HOST_CRAWLER,
  GRPC_HOST_MAV,
} from "@app/config/rpc";
import { Service, getProto } from "./website";

let client: Service["WebsiteService"]["service"]; // app rpc server
let pageMindClient: Service["WebsiteService"]["service"];
let crawlerClient: Service["WebsiteService"]["service"];
let mavClient: Service["WebsiteService"]["service"];

// create gRPC client for central application (TESTING purposes)
const createClient = async () => {
  try {
    const { website } = (await getProto()) as any;
    client = new website.WebsiteService(
      GRPC_HOST,
      credentials.createInsecure()
    );
  } catch (e) {
    console.error(e);
  }
};

const createPageMindClient = async () => {
  try {
    const { WebsiteService } = await getProto("pagemind.proto");
    pageMindClient = new WebsiteService(
      GRPC_HOST_PAGEMIND,
      credentials.createInsecure()
    );
  } catch (e) {
    console.error(e);
  }
};

const createCrawlerClient = async () => {
  try {
    const { crawler } = await getProto("crawler.proto");

    crawlerClient = new crawler.Greeter(
      GRPC_HOST_CRAWLER,
      credentials.createInsecure()
    );
  } catch (e) {
    console.error(e);
  }
};

const createMavClient = async () => {
  try {
    const { WebsiteService } = await getProto("pagemind.proto");
    mavClient = new WebsiteService(GRPC_HOST_MAV, credentials.createInsecure());
  } catch (e) {
    console.error(e);
  }
};

export const killClient = () => {
  client?.close();
  pageMindClient?.close();
  crawlerClient?.close();
  mavClient?.close();
};

export {
  client,
  pageMindClient,
  crawlerClient,
  mavClient,
  createClient,
  createPageMindClient,
  createCrawlerClient,
  createMavClient,
};
