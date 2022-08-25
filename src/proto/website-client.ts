import { credentials } from "@grpc/grpc-js";
import {
  GRPC_HOST_PAGEMIND,
  GRPC_HOST_CRAWLER,
  GRPC_HOST_MAV,
} from "../config/rpc";
import { Service, getProto } from "./website";

let pageMindClient: Service["WebsiteService"]["service"];
let crawlerClient: Service["WebsiteService"]["service"];
let mavClient: Service["WebsiteService"]["service"];

const createPageMindClient = async () => {
  try {
    const { Pagemind } = await getProto("pagemind.proto");
    pageMindClient = new Pagemind(
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

    crawlerClient = new crawler.Crawler(
      GRPC_HOST_CRAWLER,
      credentials.createInsecure()
    );
  } catch (e) {
    console.error(e);
  }
};

const createMavClient = async () => {
  try {
    const { Mav } = await getProto("mav.proto");
    mavClient = new Mav(GRPC_HOST_MAV, credentials.createInsecure());
  } catch (e) {
    console.error(e);
  }
};

export const killClient = () => {
  pageMindClient?.close();
  crawlerClient?.close();
  mavClient?.close();
};

export {
  pageMindClient,
  crawlerClient,
  mavClient,
  createPageMindClient,
  createCrawlerClient,
  createMavClient,
};
