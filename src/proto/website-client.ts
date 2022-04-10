import { credentials } from "@grpc/grpc-js";
import { GRPC_HOST, GRPC_HOST_PAGEMIND } from "@app/config/rpc";
import { Service, getProto } from "./website";

let client: Service["WebsiteService"]["service"]; // app rpc server
let pageMindClient: Service["WebsiteService"]["service"]; // pagemind rpc server

// create gRPC client
const createClient = async (internal?: boolean) => {
  try {
    const { WebsiteService } = await getProto();
    client = new WebsiteService(
      internal ? GRPC_HOST : GRPC_HOST_PAGEMIND,
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

export const killClient = () => {
  client?.close();
};

export { client, pageMindClient, createClient, createPageMindClient };
