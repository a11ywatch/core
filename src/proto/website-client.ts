import { credentials } from "@grpc/grpc-js";
import {
  GRPC_HOST_PAGEMIND,
  GRPC_HOST_CRAWLER,
  GRPC_HOST_MAV,
  GRPC_HOST_CDN,
} from "../config/rpc";
import { Service, getProto } from "./website";

let pageMindClient: Service["WebsiteService"]["service"];
let crawlerClient: Service["WebsiteService"]["service"];
let mavClient: Service["WebsiteService"]["service"];
let cdnClient: Service["WebsiteService"]["service"];

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

const createCDNClient = async () => {
  const { Cdn } = await getProto("cdn.proto");
  cdnClient = new Cdn(GRPC_HOST_CDN, credentials.createInsecure());
};

export const killClient = () => {
  pageMindClient?.close();
  crawlerClient?.close();
  mavClient?.close();
  cdnClient?.close();
};

export {
  pageMindClient,
  crawlerClient,
  mavClient,
  cdnClient,
  createPageMindClient,
  createCrawlerClient,
  createMavClient,
  createCDNClient,
};
