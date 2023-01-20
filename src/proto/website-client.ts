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
  const { Pagemind } = await getProto("pagemind.proto");
  pageMindClient = new Pagemind(
    GRPC_HOST_PAGEMIND,
    credentials.createInsecure()
  );
};

const createCrawlerClient = async () => {
  const { crawler } = await getProto("crawler.proto");
  crawlerClient = new crawler.Crawler(
    GRPC_HOST_CRAWLER,
    credentials.createInsecure()
  );
};

const createMavClient = async () => {
  const { Mav } = await getProto("mav.proto");
  mavClient = new Mav(GRPC_HOST_MAV, credentials.createInsecure());
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
